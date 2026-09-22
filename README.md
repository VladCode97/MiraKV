# MiraKV

MiraKV is an experimental key-value storage engine built from scratch to explore how database and storage systems work internally.

The project focuses on understanding and implementing the fundamental mechanisms behind:

- binary data representation;
- persistent storage;
- page-based storage;
- record layout and slot management;
- indexing structures;
- query execution;
- adaptive indexing;
- partitioning and replication;
- and workload-oriented storage strategies.

MiraKV is primarily a learning and experimentation project. The goal is not to compete with mature database systems, but to progressively build a storage engine while understanding the mechanisms that make those systems work.

---

## Motivation

MiraKV is built around six main goals:

1. Understand how databases work internally and build the fundamental mechanisms of a storage engine.
2. Explore adaptive indexing strategies based on observed query workloads.
3. Design a simple, intuitive, and composable query language.
4. Explore distributed mechanisms such as replication and partitioning.
5. Support columnar data processing when the workload requires it.
6. Explore mechanisms for predictable and low response times under defined workloads, dataset sizes, and resource constraints.

The project is intended to evolve from a single-node engine toward a distributed system while preserving the principles that define its design.

---

## Design Principles

### Complexity Reduction

The internal complexity of the system may grow, but the complexity exposed to the user should grow as little as possible.

### External Simplicity

Internal implementation details should not be unnecessarily exposed to users.

### Composition

System capabilities should be composable without introducing a completely different vocabulary for every operation.

### Separation Between Logical and Physical Representation

Logical data representation should remain independent from its binary and physical representation.

### Explicit Decisions

Important architectural decisions should be documented together with alternatives and trade-offs.

### Workload-Based Adaptation

Internal structures should be able to adapt to observed query behavior.

### Incremental Evolution

Individual components should be able to evolve without requiring the entire system to be rebuilt.

---

## Architecture

The architecture is being developed incrementally.

The current direction is:

```text
MiraKV
│
├── Storage Engine
│   ├── Pages
│   ├── Records
│   └── Page Manager
│
├── Binary Format
│   ├── Binary Envelope
│   ├── Primitive Codecs
│   └── Object Codec
│
├── Index Manager
│   ├── Hash
│   ├── AVL
│   ├── B+Tree
│   ├── LSM
│   └── Learned Indexes
│
└── Future
    ├── Query Engine
    ├── Aggregations
    ├── Partitioning
    └── Replication
```

Some components shown above represent planned areas of exploration and are not yet implemented.

---

## Binary Format

MiraKV uses a custom binary representation instead of relying on a language-specific serialization format.

The current binary envelope is:

```text
┌─────────┬──────┬────────┬─────────────┬──────────┐
│ Version │ Type │ Length │   Payload   │ Encoding │
└─────────┴──────┴────────┴─────────────┴──────────┘
```

```text
Version  → 1 byte
Type     → 1 byte
Length   → 4 bytes
Payload  → N bytes
Encoding → 1 byte
```

Current value types include:

```text
String
Number
Boolean
Object
```

The format is designed around the binary representation itself rather than around a specific programming language.

### Cross-language validation

The binary format has already been tested across different languages:

```text
TypeScript → Rust
TypeScript → Go
Rust       → TypeScript
```

The same binary representation can therefore be produced and consumed by independent implementations.

This is an important design property of MiraKV: the storage format should belong to the protocol, not to the language that produced it.

See the [Binary Format documentation](docs/binary-format/mira-kv-binary-format.md).

---

## Storage Model

MiraKV uses a Page-based storage model.

A Page is a logical storage unit containing:

```text
┌──────────────────────────────┐
│ Header                       │
├──────────────────────────────┤
│ Slots                        │
├──────────────────────────────┤
│ Free Space                   │
├──────────────────────────────┤
│ Records                      │
└──────────────────────────────┘
```

Slots grow from the beginning of the Page while Records grow from the end toward the beginning.

The Slot metadata allows the engine to locate records through an `offset` and `length`.

See the [Page documentation](docs/storage/page.md).

---

## Documentation

### Architecture

- [Motivation](docs/architecture/motivation.md)
- [Principles](docs/architecture/principles.md)

### Storage

- [Page](docs/storage/page.md)

### Binary Format

- [MiraKV Binary Format](docs/binary-format/mira-kv-binary-format.md)

---

## Current Status

MiraKV is under active development.

Current work includes:

- [x] Binary envelope
- [x] String serialization
- [x] Number serialization
- [x] Boolean serialization
- [x] Object serialization
- [x] Nested object serialization
- [x] Binary deserialization
- [x] Cross-language validation with Rust
- [x] Cross-language validation with Go
- [ ] Page implementation
- [ ] Persistent Page Manager
- [ ] Record allocation
- [ ] Index Manager
- [ ] Query engine
- [ ] Aggregations
- [ ] Partitioning
- [ ] Replication

The roadmap is intentionally incremental. Design decisions may change as the underlying mechanisms are implemented and tested.

---

## Development

The project is currently implemented in TypeScript and uses Node.js APIs for low-level binary and filesystem operations.

Additional Rust and Go implementations are used as independent interoperability experiments for the MiraKV binary format.

---

## Project Philosophy

MiraKV is an implementation laboratory.

The objective is not only to make the engine work, but to understand why each mechanism exists, how it is represented physically, what trade-offs it introduces, and how the individual components interact.

The project evolves from low-level representations toward higher-level database capabilities:

```text
Data
 ↓
Binary Representation
 ↓
Records
 ↓
Pages
 ↓
Storage Engine
 ↓
Indexes
 ↓
Queries
 ↓
Distribution
```
