---
title: For integrations
description: How to set up and use Astro Emit Asset as an integration author
---

Emitting assets can be a useful ability when building [Astro integrations](https://docs.astro.build/en/guides/integrations/#building-your-own-integration).
It allows you to offer components that a user can place in their site that rely on generated assets.

## Set up

To use `astro-emit-asset` in your integration, add it to the user’s configuration in the `astro:config:setup` hook of your integration:

```js title="index.js" ins={1,8}
import emitAssetIntegration from 'astro-emit-asset';

const myIntegration = () => {
	return {
		name: 'my-integration',
		hooks: {
			'astro:config:setup'({ updateConfig }) {
				updateConfig({ integrations: [emitAssetIntegration()] });
				// ...
			},
			// ...
		},
	};
};

export default myIntegration;
```

You can then use the `emitAsset()` utility in your integration code.

## Emitting assets

### …from components

No special handling is required in components.
Import and use `emitAsset()` from your integration’s Astro components, just as you would in other contexts.

### …from integration hooks

In general, you can use the `emitAsset()` utility directly from your integration’s hooks, just as you would in other contexts.

However, it is not possible to emit assets inside your integration’s `astro:config:setup` hook, because `astro-emit-asset` won’t be initialized yet.
If you need a reference to an emitted asset in `astro:config:setup`, emit it in `astro:config:done` and access it by reference.

In the following example, a Vite plugin is added to create a virtual module exporting an asset URL.
It accesses an `assets` object which is populated in the `astro:config:done` hook.
This works because the Vite plugin’s hooks will run after the `astro:config:done` hook.

```js title="index.js" {"1":5-6} {"2":33-36} {"3":21-25}
import emitAssetIntegration from 'astro-emit-asset';
import { emitAsset } from 'astro-emit-asset/emit';

const myIntegration = () => {
	// Object to store assets emitted in the `astro:config:done` hook.
	const assets = {};

	return {
		name: 'my-integration',
		hooks: {
			'astro:config:setup'({ updateConfig }) {
				updateConfig({
					integrations: [emitAssetIntegration()],

					// An example Vite plugin that re-exports an asset URL.
					vite: {
						plugins: [
							{
								name: 'vite-plugin-asset',
								resolveId: (id) => (id === 'virtual:example' ? '\0virtual:example' : undefined),
								// Access an asset from this plugin method that will be called later.
								load: (id) =>
									id === '\0virtual:example'
										? `export const assetUrl = ${JSON.stringify(assets.myAsset.src)}`
										: undefined,
							},
						],
					},
				});
			},

			async 'astro:config:done'() {
				// Assign emitted assets to the shared object.
				assets.myAsset = await emitAsset('example.txt', [], () => {
					return { data: 'Example' };
				});
			},
		},
	};
};
```

<!-- ### ...from Markdown plugins -->

<!-- TODO -->

## Tips

### Use a path prefix

Because `emitAsset()` adds a hash to file names, conflicts are extremely unlikely. Nevertheless, you may prefer to add a prefix to the file names you pass to `emitAsset()` to namespace all your generated assets:

```js
emitAsset('/my-integration/example.png', [], generatePNG);
// => { src: "/_astro/my-integration/example.HASH.png" }
```
