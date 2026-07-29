---
'astro-emit-asset': patch
---

Avoids indexing the filename for an asset returned in an array with only one member.

Previously, returning `[{ data: '...' }]` from an asset generator would result in a filename like `example.0.HASH.jpg`. The unnecessary index is now skipped, resulting in a cleaner filename like `example.HASH.jpg`.
