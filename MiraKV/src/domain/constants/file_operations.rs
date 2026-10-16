//! File open modes for the MiraKV storage file.
//!
//! The TypeScript source exposed Node's raw flag strings (`"r"`, `"w+"`, …).
//! Those strings have no meaning in Rust, where files are opened through
//! `std::fs::OpenOptions`. This enum captures the same intent semantically;
//! each variant maps to a specific `OpenOptions` configuration at the call
//! site rather than to a flag string.

/// Semantic file open modes, mirroring the modes used by the engine.
///
/// Suggested `OpenOptions` mapping when this is wired into the storage layer:
/// - `Read`      → `read(true)`
/// - `ReadWrite` → `read(true).write(true)`
/// - `Write`     → `write(true).create(true).truncate(true)`
/// - `WriteRead` → `read(true).write(true).create(true).truncate(true)`
/// - `Append`    → `append(true).create(true)`
/// - `AppendRead`→ `read(true).append(true).create(true)`
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FileOperation {
    /// Read only; fails if the file does not exist.
    Read,
    /// Read and write; fails if the file does not exist.
    ReadWrite,
    /// Write only; creates the file, truncates if it exists.
    Write,
    /// Read and write; creates the file, truncates if it exists.
    WriteRead,
    /// Append only; creates the file if it does not exist.
    Append,
    /// Read and append; creates the file if it does not exist.
    AppendRead,
}
