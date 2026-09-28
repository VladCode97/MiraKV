# MiraKV Benchmarks

This document records write-throughput benchmarks for the MiraKV storage
engine. Each entry documents the machine, the workload, and the measured
result so the numbers remain reproducible and comparable across changes.

> These are early-stage benchmarks focused on the write path
> (serialization + paging + persistence + AVL indexing). They are not
> intended as competitive comparisons against mature database systems.

---

## Test Environment

| Property | Value |
| --- | --- |
| Machine | Apple Mac17,2 |
| CPU | Apple M5 (10 cores) |
| Architecture | arm64 |
| RAM | 16 GB |
| OS | macOS 26.6.2 |
| Runtime | Node.js v25.0.0 (via `tsx`) |
| Storage | Internal SSD |

---

## Workload

Sequential insertion of synthetic user records. Each record is an object
with four string fields, including a 1,000-character `description` field
that dominates the serialized record size.

```ts
{
  name: `User ${i}`,
  doc: `${1 + i}`,
  number: `+57 300 ${i}`,
  description: "x".repeat(1000),
}
```

Each record is:

1. Serialized to the MiraKV binary format.
2. Allocated into a 16 KiB page (slot + record).
3. Indexed in an in-memory AVL tree keyed by `doc`.
4. Persisted to disk when a page fills or on `close()`.

Page size: **16 KiB**. Records are ~1,170 bytes serialized, so roughly
**15 records fit per page** before rotation.

---

## Results

### Write throughput (with AVL indexing)

| Records | Time (s) | Throughput (records/s) | On-disk size | AVL height |
| ---: | ---: | ---: | ---: | ---: |
| 1,000,000 | 4.6 | ~216,000 | ~1.2 GB | 22 |
| 10,000,000 | 48.1 | ~207,000 | 11.7 GB | 26 |

### Index cost isolation (10M records)

Measures the write path with AVL indexing disabled, to isolate the cost of
indexing from serialization and disk I/O.

| Configuration | Time (s) |
| --- | ---: |
| With AVL indexing | 48.1 |
| Without AVL indexing | 50.4 |

The difference is within run-to-run measurement noise.

---

## Observations

### Throughput scales linearly

From 1M to 10M records, time grew ~10x (4.6s → 48s) while throughput stayed
nearly constant (~216k/s → ~207k/s). This indicates no hidden super-linear
bottleneck in the write path across this range.

### AVL height stays logarithmic

| Records | Measured height | Theoretical optimum (≈ log₂ n) |
| ---: | ---: | ---: |
| 1,000,000 | 22 | ~20 |
| 10,000,000 | 26 | ~23 |

A 10x increase in records raised height by only 4 levels, confirming the
AVL rebalancing keeps the tree close to optimal.

### Indexing is effectively free on the write path

With records this size and real persistence, disabling the AVL changed total
time by ~2s over 10M inserts — within noise. The dominant cost is
serialization plus disk I/O, not indexing.

**Implication for adaptive indexing:** if index insertion cost is negligible
relative to I/O, the criterion for choosing an index structure should be
driven by *read performance* and *memory footprint*, not by insertion cost.

---

## Known Limits

- **In-memory index ceiling.** The AVL index lives entirely in RAM. At ~100M
  records the index alone is estimated at multiple GB and is expected to hit
  V8's heap limit before the write completes. This is the motivating problem
  for disk-resident index structures (e.g. B+Tree in pages) and for the
  adaptive indexing work.
- **Page fill efficiency.** Records are ~1,170 bytes into 16 KiB pages, so
  each page holds ~15 records and leaves unused tail space before rotation.
  Some space overhead is expected in page-based storage.

---

## How to Reproduce

```bash
npx tsx src/index.ts
```

Adjust the `RECORDS` constant in `src/index.ts` to change the workload size.
The output reports the record count, AVL height, and elapsed seconds.
