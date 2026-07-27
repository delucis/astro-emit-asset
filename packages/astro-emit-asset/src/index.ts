import type { AstroIntegration, AstroConfig } from 'astro';
import { lookup } from 'mrmime';
import { AssetStore } from './cache.js';
import { NAMESPACE } from './constants.js';

declare var globalThis: {
	[NAMESPACE]: {
		cache: AssetStore;
	};
};

// TODO: Handle multiple instances of this integration in the same project.
// Currently, the dev middleware will run once per instance and the end of the build will repeatedly
// copy the emitted assets to the build output. It won’t break, but there’ll be duplicate logging
// and duplicate file copying.

/**
 * Astro integration that enables components and other code to emit static assets to the build output.
 *
 * @example
 * ```js
 * import emitAsset from 'astro-emit-asset';
 * import { defineConfig } from 'astro/config';
 *
 * export default defineConfig({
 *   integrations: [emitAsset()],
 * });
 * ```
 */
export default (): AstroIntegration => {
	return {
		name: NAMESPACE,
		hooks: {
			async 'astro:config:setup'({ command, config, updateConfig, logger }) {
				/** Astro’s configured assets directory, `/_astro/` by default. */
				const assetsDir = `/${config.build.assets}/`;
				const base = config.base.endsWith('/') ? config.base.slice(0, -1) : config.base;
				/** Prefix a URL pathname with the site `base` if configured. */
				const prefixBase = (path: string) => (config.base !== '/' ? `${base}${path}` : path);

				globalThis[NAMESPACE] = {
					cache: new AssetStore({
						assetsDir: prefixBase(assetsDir),
						base,
						cacheDir: new URL('./emit-asset/', config.cacheDir),
						logger,
					}),
				};

				if (command === 'dev') {
					updateConfig({ vite: { plugins: [devMiddleware({ assetsDir, prefixBase })] } });
				}
			},

			async 'astro:build:done'({ dir }) {
				await globalThis[NAMESPACE].cache.finalizeBuild(dir);
			},
		},
	};
};

type VitePlugin = NonNullable<AstroConfig['vite']['plugins']>[number];

/**
 * Plugin adding a Vite middleware to serve emitted assets during development.
 */
function devMiddleware({
	assetsDir,
	prefixBase,
}: {
	assetsDir: string;
	prefixBase: (path: string) => string;
}) {
	return {
		name: NAMESPACE,
		enforce: 'pre',
		configureServer(server) {
			return () =>
				server.middlewares.use(async (req, res, next) => {
					if (!req.url?.startsWith(assetsDir)) return next();
					// Vite middleware URLs do not include the site `base`, so we need to prefix it here to
					// match the paths stored in the emitted asset store.
					const filePath = prefixBase(req.url);
					if (globalThis[NAMESPACE].cache.hasFile(filePath)) {
						const content = await globalThis[NAMESPACE].cache.getFile(filePath);
						const type = lookup(filePath) || 'text/plain';
						res.statusCode = 200;
						res.setHeader('Content-Type', type);
						res.end(content);
						return;
					}
					return next();
				});
		},
	} satisfies VitePlugin;
}
