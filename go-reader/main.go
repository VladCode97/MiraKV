package main

import (
	"encoding/binary"
	"fmt"
	"os"
	"time"
	"unsafe"
)

const (
	PageSize   = 16 * 1024
	PageHeader = 9
	SlotSize   = 9

	// Binary types
	TypeReserved = 0x00
	TypeBoolean  = 0x01
	TypeNumber   = 0x02
	TypeString   = 0x03
	TypeObject   = 0x04
	TypeNull     = 0x05
	TypeDate     = 0x06
	TypeArray    = 0x07

	// Encodings
	EncodingReserved       = 0x00
	EncodingFloat64        = 0x01
	EncodingUTF8           = 0x02
	EncodingBoolean8       = 0x03
	EncodingUnixTimeMs     = 0x04
	EncodingHomogeneousArr = 0x05
)

type Envelope struct {
	Version  byte
	Type     byte
	Length   uint32
	Payload  []byte
	Encoding byte
}

type Reader struct {
	file *os.File
}

func NewReader(path string) (*Reader, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	return &Reader{
		file: file,
	}, nil
}

func (r *Reader) Close() error {
	return r.file.Close()
}

func (r *Reader) ReadPages() error {
	stat, err := r.file.Stat()
	if err != nil {
		return err
	}

	pageCount := int(stat.Size()) / PageSize

	fmt.Printf("File size: %d bytes\n", stat.Size())
	fmt.Printf("Pages: %d\n\n", pageCount)

	for pageID := 0; pageID < pageCount; pageID++ {
		if err := r.readPage(pageID); err != nil {
			return err
		}
	}

	return nil
}

func (r *Reader) readPage(pageID int) error {
	page := make([]byte, PageSize)

	offset := int64(pageID * PageSize)

	_, err := r.file.ReadAt(page, offset)
	if err != nil {
		return err
	}

	version := page[0]
	storedPageID := binary.LittleEndian.Uint32(page[1:5])
	slotCount := binary.LittleEndian.Uint32(page[5:9])

	fmt.Printf("========================================\n")
	fmt.Printf("PAGE %d\n", pageID)
	fmt.Printf("========================================\n")
	fmt.Printf("Version:    %d\n", version)
	fmt.Printf("Page ID:    %d\n", storedPageID)
	fmt.Printf("Slot count: %d\n\n", slotCount)

	for slot := uint32(0); slot < slotCount; slot++ {
		slotOffset := PageHeader + int(slot)*SlotSize

		slotID := page[slotOffset]
		recordOffset := binary.LittleEndian.Uint32(
			page[slotOffset+1 : slotOffset+5],
		)
		recordLength := binary.LittleEndian.Uint32(
			page[slotOffset+5 : slotOffset+9],
		)

		fmt.Printf("Slot %d\n", slot)
		fmt.Printf("  Slot ID:       %d\n", slotID)
		fmt.Printf("  Record offset: %d\n", recordOffset)
		fmt.Printf("  Record length: %d\n", recordLength)

		recordEnd := int(recordOffset + recordLength)

		if recordEnd > len(page) {
			return fmt.Errorf(
				"record exceeds page boundary: offset=%d length=%d",
				recordOffset,
				recordLength,
			)
		}

		record := page[recordOffset:recordEnd]

		value, err := decodeEnvelope(record, 1)
		if err != nil {
			return fmt.Errorf(
				"page %d slot %d: %w",
				pageID,
				slot,
				err,
			)
		}

		fmt.Printf("  Value:\n")
		printValue(value, 2)
		fmt.Println()
	}

	return nil
}

func decodeEnvelope(data []byte, depth int) (any, error) {
	if len(data) < 7 {
		return nil, fmt.Errorf("invalid envelope: %d bytes", len(data))
	}

	version := data[0]
	typ := data[1]
	length := binary.LittleEndian.Uint32(data[2:6])

	expectedLength := 7 + int(length)

	if len(data) < expectedLength {
		return nil, fmt.Errorf(
			"invalid envelope length: expected=%d actual=%d",
			expectedLength,
			len(data),
		)
	}

	payload := data[6 : 6+length]
	encoding := data[6+length]

	fmt.Printf(
		"%*sEnvelope: version=%d type=0x%02X length=%d encoding=0x%02X\n",
		depth*2,
		"",
		version,
		typ,
		length,
		encoding,
	)

	switch typ {
	case TypeString:
		return string(payload), nil

	case TypeNumber:
		if len(payload) != 8 {
			return nil, fmt.Errorf(
				"invalid number payload length: %d",
				len(payload),
			)
		}

		bits := binary.LittleEndian.Uint64(payload)
		return bitsToFloat64(bits), nil

	case TypeBoolean:
		if len(payload) != 1 {
			return nil, fmt.Errorf(
				"invalid boolean payload length: %d",
				len(payload),
			)
		}

		return payload[0] != 0, nil

	case TypeNull:
		return nil, nil

	case TypeDate:
		dateString := string(payload)

		// The current TypeScript codec writes ISO-8601 UTF-8.
		date, err := time.Parse(time.RFC3339Nano, dateString)
		if err != nil {
			return nil, fmt.Errorf(
				"invalid date payload %q: %w",
				dateString,
				err,
			)
		}

		return date, nil

	case TypeObject:
		return decodeObject(payload, depth+1)

	case TypeArray:
		return decodeArray(payload)

	default:
		return nil, fmt.Errorf(
			"unsupported binary type: 0x%02X",
			typ,
		)
	}
}

// decodeArray decodes a homogeneous primitive array payload.
//
// Layout: [elementType:1][count:4] followed by count elements, each encoded
// as [length:4][payload:length]. Element payloads are raw codec output (no
// per-element envelope), so the shared elementType from the header drives how
// each payload is decoded.
func decodeArray(data []byte) ([]any, error) {
	if len(data) < 5 {
		return nil, fmt.Errorf("invalid array payload: %d bytes", len(data))
	}

	elementType := data[0]
	count := binary.LittleEndian.Uint32(data[1:5])

	elements := make([]any, 0, count)
	offset := 5

	for i := uint32(0); i < count; i++ {
		if offset+4 > len(data) {
			return nil, fmt.Errorf("missing element length in array")
		}

		length := int(binary.LittleEndian.Uint32(data[offset : offset+4]))
		offset += 4

		if offset+length > len(data) {
			return nil, fmt.Errorf("element payload exceeds array payload")
		}

		payload := data[offset : offset+length]
		offset += length

		value, err := decodeArrayElement(elementType, payload)
		if err != nil {
			return nil, err
		}

		elements = append(elements, value)
	}

	return elements, nil
}

// decodeArrayElement decodes a single array element given its shared type.
func decodeArrayElement(elementType byte, payload []byte) (any, error) {
	switch elementType {
	case TypeString:
		return string(payload), nil

	case TypeNumber:
		if len(payload) != 8 {
			return nil, fmt.Errorf(
				"invalid number payload length: %d",
				len(payload),
			)
		}
		bits := binary.LittleEndian.Uint64(payload)
		return bitsToFloat64(bits), nil

	case TypeBoolean:
		if len(payload) != 1 {
			return nil, fmt.Errorf(
				"invalid boolean payload length: %d",
				len(payload),
			)
		}
		return payload[0] != 0, nil

	default:
		return nil, fmt.Errorf(
			"unsupported array element type: 0x%02X",
			elementType,
		)
	}
}

func decodeObject(data []byte, depth int) (map[string]any, error) {
	object := make(map[string]any)

	offset := 0

	for offset < len(data) {
		if offset+1 > len(data) {
			return nil, fmt.Errorf("missing key length")
		}

		keyLength := int(data[offset])
		offset++

		if offset+keyLength > len(data) {
			return nil, fmt.Errorf("key exceeds object payload")
		}

		key := string(data[offset : offset+keyLength])
		offset += keyLength

		if offset+7 > len(data) {
			return nil, fmt.Errorf(
				"missing value envelope for key %q",
				key,
			)
		}

		valueLength := binary.LittleEndian.Uint32(
			data[offset+2 : offset+6],
		)

		envelopeLength := 7 + int(valueLength)

		if offset+envelopeLength > len(data) {
			return nil, fmt.Errorf(
				"value envelope exceeds object payload for key %q",
				key,
			)
		}

		valueEnvelope := data[offset : offset+envelopeLength]

		value, err := decodeEnvelope(valueEnvelope, depth)
		if err != nil {
			return nil, fmt.Errorf(
				"key %q: %w",
				key,
				err,
			)
		}

		object[key] = value

		offset += envelopeLength
	}

	return object, nil
}

func bitsToFloat64(bits uint64) float64 {
	return *(*float64)(unsafe.Pointer(&bits))
}

func printValue(value any, indent int) {
	prefix := ""

	for i := 0; i < indent; i++ {
		prefix += "  "
	}

	switch value := value.(type) {
	case map[string]any:
		fmt.Println(prefix + "{")

		for key, nested := range value {
			fmt.Printf("%s  %s: ", prefix, key)

			if nestedMap, ok := nested.(map[string]any); ok {
				fmt.Println()
				printValue(nestedMap, indent+2)
			} else {
				fmt.Printf("%v\n", nested)
			}
		}

		fmt.Println(prefix + "}")

	case time.Time:
		fmt.Printf("%s%s\n", prefix, value.Format(time.RFC3339Nano))

	case []any:
		fmt.Println(prefix + "[")

		for _, item := range value {
			printValue(item, indent+1)
		}

		fmt.Println(prefix + "]")

	default:
		fmt.Printf("%v\n", value)
	}
}

func main() {
	reader, err := NewReader("../data/mira.mkv")
	if err != nil {
		panic(err)
	}

	defer reader.Close()

	if err := reader.ReadPages(); err != nil {
		panic(err)
	}
}
