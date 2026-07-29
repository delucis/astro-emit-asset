# astro-emit-asset

## 0.1.4

### Patch Changes

- [`321daae`](https://github.com/delucis/astro-emit-asset/commit/321daaed356b5ca5f0bcff28be7493123f536582) Thanks [@delucis](https://github.com/delucis)! - Avoids indexing the filename for an asset returned in an array with only one member.

  Previously, returning `[{ data: '...' }]` from an asset generator would result in a filename like `example.0.HASH.jpg`. The unnecessary index is now skipped, resulting in a cleaner filename like `example.HASH.jpg`.

- [`34758c7`](https://github.com/delucis/astro-emit-asset/commit/34758c79dc5d82be0e27b19d69a95355c6fc6f5a) Thanks [@delucis](https://github.com/delucis)! - Starts indexing at `1` for file names in assets that return multiple files.

  Previously, calling `emitAsset()` and returning an array of files would result in file names like `example.0.HASH.jpg`, `example.1.HASH.jpg`, etc. containing an incrementing index starting at `0` for each file. This index now starts at `1` instead of `0`, resulting in file names like `example.1.HASH.jpg`, `example.2.HASH.jpg`, etc.

## 0.1.3

### Patch Changes

- [#8](https://github.com/delucis/astro-emit-asset/pull/8) [`ea662c9`](https://github.com/delucis/astro-emit-asset/commit/ea662c979b2a6ccaa5ef5f791940a65787567e23) Thanks [@delucis](https://github.com/delucis)! - Fixes asset serving on dev server restarts

## 0.1.2

### Patch Changes

- [#6](https://github.com/delucis/astro-emit-asset/pull/6) [`51a7656`](https://github.com/delucis/astro-emit-asset/commit/51a7656623389596670c8735d61955516475ab62) Thanks [@delucis](https://github.com/delucis)! - Fixes support for multiple instances of `astro-emit-asset`. This ensures that the integration can be included multiple times (e.g. by different packages that depend on it) without any issues.

## 0.1.1

### Patch Changes

- [#4](https://github.com/delucis/astro-emit-asset/pull/4) [`bc31675`](https://github.com/delucis/astro-emit-asset/commit/bc316755edb6010e5372021ef6d5086d39943e40) Thanks [@kydecker](https://github.com/kydecker)! - Fixes missing types for `emitAsset()`

## 0.1.0

### Minor Changes

- [`cb0d462`](https://github.com/delucis/astro-emit-asset/commit/cb0d462fe856b0c97d39c707c02950675842d6c7) Thanks [@delucis](https://github.com/delucis)! - Initial release
