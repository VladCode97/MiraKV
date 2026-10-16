//! Global constants shared across the MiraKV storage engine.

/// Maximum number of pages held in memory before a flush is required.
/// This is a provisional limit used during early development.
// TODO: replace with a configurable buffer pool size once the page manager
// supports multi-page management.
pub const PAGE_LIMIT: usize = 16;
