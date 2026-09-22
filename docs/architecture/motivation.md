# Motivation

MiraKV is built around six main goals:

- Understand how databases work internally and, subsequently, build the fundamental mechanisms of a storage engine.
- Build an adaptive indexing engine capable of selecting and adjusting indexing strategies according to observed query patterns over collection properties.
- Design a query language that is:
  - Simple.
  - Easy to understand.
  - Intuitive.
  - Composable.
- Build a distributed engine focused on:
  - Replication.
  - Partitioning.
- Allow data to be processed under a columnar model when the workload requires it.
- Explore mechanisms that can provide predictable and low response times under specific workloads, dataset sizes, and available resources.

The initial goal is not to compete with database systems that have been evolving for decades, but to build an engine focused on combining:

- simplicity of implementation and usage,
- adaptive indexing,
- a simple query model,
- flexible storage,
- and distributed scaling capabilities.

The intention is for the system to evolve from a single-node architecture to multiple nodes without losing the fundamental principles that define the project.
