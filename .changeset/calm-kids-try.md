---
"astro-emit-asset": patch
---

Fixes support for multiple instances of `astro-emit-asset`. This ensures that the integration can be included multiple times (e.g. by different packages that depend on it) without any issues.
