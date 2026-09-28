use std::fs::File;
use std::io::{Read, Seek, SeekFrom};

const PAGE_SIZE: usize = 16 * 1024;
const PAGE_HEADER_SIZE: usize = 9;
const SLOT_SIZE: usize = 9;

const TYPE_BOOLEAN: u8 = 0x01;
const TYPE_NUMBER: u8 = 0x02;
const TYPE_STRING: u8 = 0x03;
const TYPE_OBJECT: u8 = 0x04;
const TYPE_NULL: u8 = 0x05;
const TYPE_DATE: u8 = 0x06;

fn read_u32_le(data: &[u8]) -> u32 {
    u32::from_le_bytes([data[0], data[1], data[2], data[3]])
}

fn read_page(file: &mut File, page_id: usize) -> Result<(), String> {
    let mut page = vec![0u8; PAGE_SIZE];

    file.seek(SeekFrom::Start((page_id * PAGE_SIZE) as u64))
        .map_err(|e| e.to_string())?;

    file.read_exact(&mut page).map_err(|e| e.to_string())?;

    let version = page[0];

    let stored_page_id = read_u32_le(&page[1..5]);

    let slot_count = read_u32_le(&page[5..9]);

    println!("========================================");
    println!("PAGE {}", page_id);
    println!("========================================");
    println!("Version:    {}", version);
    println!("Page ID:    {}", stored_page_id);
    println!("Slot count: {}\n", slot_count);

    for slot_index in 0..slot_count as usize {
        let slot_offset = PAGE_HEADER_SIZE + slot_index * SLOT_SIZE;

        let slot_id = page[slot_offset];

        let record_offset = read_u32_le(&page[slot_offset + 1..slot_offset + 5]);

        let record_length = read_u32_le(&page[slot_offset + 5..slot_offset + 9]);

        println!("Slot {}", slot_index);
        println!("  Slot ID:       {}", slot_id);
        println!("  Record offset: {}", record_offset);
        println!("  Record length: {}", record_length);

        let record_start = record_offset as usize;
        let record_end = record_start + record_length as usize;

        if record_end > PAGE_SIZE {
            return Err(format!(
                "Record exceeds page boundary: offset={} length={}",
                record_offset, record_length
            ));
        }

        let record = &page[record_start..record_end];

        let value = decode_envelope(record, 1)?;

        println!("  Value:");
        print_value(&value, 2);
        println!();
    }

    Ok(())
}

#[derive(Debug)]
enum Value {
    Null,
    Boolean(bool),
    Number(f64),
    String(String),
    Date(String),
    Object(Vec<(String, Value)>),
}

fn decode_envelope(data: &[u8], depth: usize) -> Result<Value, String> {
    if data.len() < 7 {
        return Err(format!("Invalid envelope: {} bytes", data.len()));
    }

    let version = data[0];
    let value_type = data[1];

    let length = read_u32_le(&data[2..6]) as usize;

    let expected_length = 7 + length;

    if data.len() < expected_length {
        return Err(format!(
            "Invalid envelope length: expected={} actual={}",
            expected_length,
            data.len()
        ));
    }

    let payload = &data[6..6 + length];

    let encoding = data[6 + length];

    println!(
        "{:indent$}Envelope: version={} type=0x{:02X} length={} encoding=0x{:02X}",
        "",
        version,
        value_type,
        length,
        encoding,
        indent = depth * 2
    );

    match value_type {
        TYPE_STRING => {
            let value = String::from_utf8(payload.to_vec()).map_err(|e| e.to_string())?;

            Ok(Value::String(value))
        }

        TYPE_NUMBER => {
            if payload.len() != 8 {
                return Err(format!("Invalid number payload length: {}", payload.len()));
            }

            let mut bytes = [0u8; 8];
            bytes.copy_from_slice(payload);

            let value = f64::from_le_bytes(bytes);

            Ok(Value::Number(value))
        }

        TYPE_BOOLEAN => {
            if payload.len() != 1 {
                return Err(format!("Invalid boolean payload length: {}", payload.len()));
            }

            Ok(Value::Boolean(payload[0] != 0))
        }

        TYPE_NULL => Ok(Value::Null),

        TYPE_DATE => {
            let value = String::from_utf8(payload.to_vec()).map_err(|e| e.to_string())?;

            Ok(Value::Date(value))
        }

        TYPE_OBJECT => decode_object(payload, depth + 1),

        _ => Err(format!("Unsupported binary type: 0x{:02X}", value_type)),
    }
}

fn decode_object(data: &[u8], depth: usize) -> Result<Value, String> {
    let mut object = Vec::new();
    let mut offset = 0;

    while offset < data.len() {
        let key_length = data[offset] as usize;
        offset += 1;

        if offset + key_length > data.len() {
            return Err("Key exceeds object payload".to_string());
        }

        let key = String::from_utf8(data[offset..offset + key_length].to_vec())
            .map_err(|e| e.to_string())?;

        offset += key_length;

        if offset + 7 > data.len() {
            return Err(format!("Missing value envelope for key '{}'", key));
        }

        let value_length = read_u32_le(&data[offset + 2..offset + 6]) as usize;

        let envelope_length = 7 + value_length;

        if offset + envelope_length > data.len() {
            return Err(format!(
                "Value envelope exceeds object payload for key '{}'",
                key
            ));
        }

        let envelope = &data[offset..offset + envelope_length];

        let value = decode_envelope(envelope, depth)?;

        object.push((key, value));

        offset += envelope_length;
    }

    Ok(Value::Object(object))
}

fn print_value(value: &Value, indent: usize) {
    let prefix = " ".repeat(indent);

    match value {
        Value::Null => {
            println!("{}null", prefix);
        }

        Value::Boolean(value) => {
            println!("{}{}", prefix, value);
        }

        Value::Number(value) => {
            println!("{}{}", prefix, value);
        }

        Value::String(value) => {
            println!("{}{}", prefix, value);
        }

        Value::Date(value) => {
            println!("{}{}", prefix, value);
        }

        Value::Object(entries) => {
            println!("{}{{", prefix);

            for (key, value) in entries {
                print!("{}  {}: ", prefix, key);

                match value {
                    Value::Object(_) => {
                        println!();
                        print_value(value, indent + 2);
                    }

                    _ => {
                        print_value(value, 0);
                    }
                }
            }

            println!("{}}}", prefix);
        }
    }
}

fn main() {
    let path = "../data/mira.mkv";

    let mut file = File::open(path).expect("Could not open mira.mkv");

    let metadata = file.metadata().expect("Could not read file metadata");

    let file_size = metadata.len() as usize;

    let page_count = file_size / PAGE_SIZE;

    println!("File size: {} bytes", file_size);

    println!("Pages: {}\n", page_count);

    for page_id in 0..page_count {
        if let Err(error) = read_page(&mut file, page_id) {
            eprintln!("Error reading page {}: {}", page_id, error);

            std::process::exit(1);
        }
    }
}
