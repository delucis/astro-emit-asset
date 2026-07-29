# `astro-emit-asset` 📤

Emit static assets from Astro components and endpoints

## Documentation

See full details in the [Astro Emit Asset docs website →](https://delucis.github.io/astro-emit-asset/)

## Install

`astro-emit-asset` is an Astro integration. Install it by running the following command in your terminal:

```sh
npx astro add astro-emit-asset
```

## Usage

Call `emitAsset()` from your project code to create assets in your static build output:

```astro
---
import { emitAsset } from 'astro-emit-asset/emit';
import { generateSvg } from './my-lib';

const { src, meta } = emitAsset('example.svg', [generateSvg], () => {
  const { data, width, height } = generateSvg();
  return {
    data,
    meta: { width, height },
  },
});
---

<img src={src} width={meta.width} height={meta.height}>
```

## License

[MIT](https://github.com/delucis/astro-emit-asset/blob/main/LICENSE)
