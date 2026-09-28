# MiraKV

MiraKV is an experimental key-value storage engine built from scratch to
explore how database and storage systems work internally — from binary
representation on disk up to indexing and retrieval.

> **Status:** Experimental · under active development.
> The core write/read path works end-to-end; several components are
> intentionally incremental. See [Current Status](#current-status).

---

## What Works Today

The following is implemented and runs end-to-end:

- **Custom binary format** — a versioned envelope with per-value type and
  encoding metadata.
- **Value codecs** — `string`, `number`, `boolean`, `object` (including
  nested objects), `date`, and homogeneous primitive `array`.
- **Page-based storage** — 16 KiB pages with slot metadata, written to disk
  by absolute page position.
- **Indexing** — a self-balancing AVL tree mapping keys to physical record
  locations, plus a hash map implementation over a shared index contract.
- **Typed collections** — a `Collection<T>` API for insert and lookup by key.

A record can be inserted as a typed object, serialized to the MiraKV binary
format, paged to disk, indexed, and later retrieved by key.

---

## Motivation

MiraKV is built around a few main goals:

1. Understand how databases work internally by building the fundamental
   mechanisms of a storage engine.
2. Explore adaptive indexing strategies based on observed query workloads.
3. Explore columnar-friendly storage through homogeneous data representation.
4. Explore distributed mechanisms such as replication and partitioning.
5. Explore predictable, low response times under defined workloads, dataset
   sizes, and resource constraints.

The project is intended to evolve from a single-node engine toward a
distributed system while preserving the principles that define its design.

---

## Design Principles

### Complexity Reduction
Internal complexity may grow, but the complexity exposed to the user should
grow as little as possible.

### External Simplicity
Internal implementation details should not be unnecessarily exposed.

### Separation Between Logical and Physical Representation
Logical data representation stays independent from its binary and physical
representation.

### Pluggable Indexing
Index structures sit behind a single contract (`IIndex`), so a bucket or a
collection can swap one structure for another without changing the layers
above it. This is the foundation for future workload-based adaptive indexing.

### Homogeneous Data Over Deep Nesting
MiraKV favors homogeneous, flat data over deeply nested structures. This is a
deliberate choice: homogeneous data compresses better, has a predictable
binary layout, and aligns with columnar processing — the same principle
behind analytical engines like Parquet and ClickHouse.

### Explicit Decisions
Important architectural decisions are documented together with their
alternatives and trade-offs.

### Incremental Evolution
Individual components can evolve without requiring the entire system to be
rebuilt.

---

## Architecture

```text
MiraKV
│
├── Collections
│   └── Collection<T>        typed insert / lookup API
│
├── Index
│   ├── IIndex               shared index contract
│   ├── AVL Tree             self-balancing, in-memory
│   └── Hash Table
│
├── Storage Engine
│   ├── Page Manager         16 KiB pages, slots, persistence
│   └── (planned) Buffer Pool
│
├── Binary Format
│   ├── Binary Envelope      [version][type][length][payload][encoding]
│   ├── Primitive Codecs     string · number · boolean · date
│   ├── Object Codec         nested objects
│   └── Array Codec          homogeneous primitive arrays
│
└── Future
    ├── Adaptive Index
    ├── Query Engine
    ├── Partitioning
    └── Replication
```

Some components above are planned areas of exploration and are not yet
implemented.

---

## Binary Format

MiraKV uses a custom binary representation instead of a language-specific
serialization format.

The binary envelope is:

```text
┌─────────┬──────┬────────┬─────────────┬──────────┐
│ Version │ Type │ Length │   Payload   │ Encoding │
└─────────┴──────┴────────┴─────────────┴──────────┘

Version  → 1 byte
Type     → 1 byte
Length   → 4 bytes
Payload  → N bytes
Encoding → 1 byte
```

Current value types:

```text
Boolean · Number · String · Object · Date · Array (homogeneous)
```

### Cross-language validation

The binary format has been tested across independent implementations:

```text
TypeScript → Rust
TypeScript → Go
Rust       → TypeScript
```

Cross-language validation covers all current value types — primitives,
object, date, and homogeneous array. The same binary representation is
produced and consumed by independent implementations.

This is a core design property of MiraKV: the storage format belongs to the
protocol, not to the language that produced it.

See the [Binary Format documentation](docs/binary-format/mira-kv-binary-format.md).

---

## Storage Model

MiraKV uses a page-based storage model. A page is a fixed-size unit
containing:

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

Slots grow from the start of the page while records grow from the end toward
the beginning. Each slot locates a record through an `offset` and `length`.

See the [Page documentation](docs/storage/page.md).

---

## Benchmarks

Early write-path benchmarks (Apple M5, Node.js) show linear scaling:

| Records | Time | On-disk |
| ---: | ---: | ---: |
| 1,000,000 | ~4.6 s | ~1.2 GB |
| 10,000,000 | ~48 s | ~11.7 GB |

Indexing cost was found to be negligible relative to disk I/O on the write
path. Full details and methodology in [docs/benchmarks.md](docs/benchmarks.md).

---

## Current Status

**Working**
- [x] Binary envelope + versioning
- [x] Codecs: string, number, boolean, object, nested object, date, array
- [x] Binary deserialization
- [x] Cross-language validation (Rust, Go) — all current value types
- [x] Page-based storage with slots and disk persistence
- [x] AVL index + hash table over `IIndex`
- [x] Typed `Collection<T>` insert / lookup

**In progress / planned**
- [ ] Storage abstraction (`IStorage`) to decouple collections from paging
- [ ] Multi-page reads and one file per collection
- [ ] Buffer pool (avoid reading the whole file per lookup)
- [ ] Durability (fsync / write-ahead log)
- [ ] Update / delete and space reclamation
- [ ] Adaptive indexing
- [ ] Query engine, partitioning, replication

The roadmap is intentionally incremental. Design decisions may change as the
underlying mechanisms are implemented and tested.

---

## Development

MiraKV is implemented in TypeScript and uses Node.js APIs for low-level
binary and filesystem operations. Independent Rust and Go implementations
exist as interoperability experiments for the MiraKV binary format.

---

## Project Philosophy

MiraKV is an implementation laboratory. The objective is not only to make the
engine work, but to understand why each mechanism exists, how it is
represented physically, what trade-offs it introduces, and how the components
interact.

```text
Data → Binary Representation → Records → Pages → Storage Engine → Indexes → Queries → Distribution
```
