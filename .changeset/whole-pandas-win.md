---
'astro-emit-asset': patch
---

Starts indexing at `1` for file names in assets that return multiple files.

Previously, calling `emitAsset()` and returning an array of files would result in file names like `example.0.HASH.jpg`, `example.1.HASH.jpg`, etc. containing an incrementing index starting at `0` for each file. This index now starts at `1` instead of `0`, resulting in file names like `example.1.HASH.jpg`, `example.2.HASH.jpg`, etc.
