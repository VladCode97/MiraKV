# MiraKV Binary Format

## TLV — Type, Length, Value

A common pattern for representing binary information is **TLV**:

```text
Type → Length → Value
```

Each value contains information that allows the system to determine how it should be interpreted.

```text
┌──────────┬──────────┬──────────────┐
│   Type   │  Length  │    Value     │
└──────────┴──────────┴──────────────┘
```

For example:

```text
TYPE_STRING

LENGTH = 4

VALUE = Luis
```

The `Type` identifies the nature of the data.

The `Length` determines how many bytes belong to the value.

The `Value` contains the binary representation of the data.

This structure allows a sequence of bytes to be traversed without depending on data structures specific to a particular programming language.

# MiraKV Binary Format

MiraKV uses this concept as the foundation for its binary representation.

The current format adds additional metadata:

```text
┌─────────┬──────┬────────┬─────────────┬──────────┐
│ Version │ Type │ Length │   Payload   │ Encoding │
└─────────┴──────┴────────┴─────────────┴──────────┘
```

The current layout is:

```text
Version  → 1 byte
Type     → 1 byte
Length   → 4 bytes
Payload  → N bytes
Encoding → 1 byte
```

Therefore, the envelope size is:

```text
1 + 1 + 4 + N + 1
```

bytes.

The presence of `Version` allows the format to evolve in the future without assuming that every version uses exactly the same layout.

`Type` identifies the logical type of the value.

`Length` indicates how many bytes belong to the `Payload`.

`Encoding` indicates how the bytes in the `Payload` should be interpreted.

## MiraKV Value Types

The current version defines:

```text
String
Number
Boolean
Object
```

The types are represented using binary identifiers:

```text
BOOLEAN → 0x01
NUMBER  → 0x02
STRING  → 0x03
OBJECT  → 0x04
```

Each type may use a different encoding for its internal representation.

For example:

```text
String
    └── UTF-8

Number
    └── IEEE-754 Binary64

Boolean
    └── Boolean 8-bit
```

Objects can contain other values.

For example:

```text
Object
├── String
├── Number
└── Boolean
```

This allows nested structures to be represented without depending on a specific programming language representation.

## Bits, Bytes, and Numeric Representation

A byte consists of 8 bits.

Each bit can represent two states:

```text
0
1
```

Therefore, `n` bits can represent:

```text
2ⁿ
```

different combinations.

For a one-byte field:

```text
1 byte = 8 bits

2⁸ = 256 combinations
```

When interpreted as an unsigned integer (`UInt8`), these values range from:

```text
0 → 255
```

Therefore, one byte can represent up to 256 different values.

For a four-byte field:

```text
4 bytes = 32 bits

2³² = 4,294,967,296
```

When interpreted as a `UInt32`, the values range from:

```text
0 → 4,294,967,295
```

In MiraKV, `Length` currently uses a `UInt32`, so its representation occupies exactly:

```text
4 bytes
```
