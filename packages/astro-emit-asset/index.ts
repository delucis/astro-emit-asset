import type { AstroIntegration, AstroConfig } from 'astro';
import { lookup } from 'mrmime';
import { AssetStore } from './cache';
import { NAMESPACE } from './constants';

declare var globalThis: {
	[NAMESPACE]: {
		cache: AssetStore;
	};
};

// TODO: Handle multiple instances of this integration in the same project.
// Currently, the dev middleware will run once per instance and the end of the build will repeatedly
// copy the emitted assets to the build output. It won’t break, but there’ll be duplicate logging
// and duplicate file copying.

// TODO: Test site using the `base` config option.

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
export default () => {
	return {
		name: NAMESPACE,
		hooks: {
			async 'astro:config:setup'({ command, config, updateConfig, logger }) {
				/** The URL path prefix from which static assets will be served. */
				let assetsDir = `/${config.build.assets}/`;
				if (config.base !== '/') {
					assetsDir = `${config.base.endsWith('/') ? config.base.slice(0, -1) : config.base}${assetsDir}`;
				}

				globalThis[NAMESPACE] = {
					cache: new AssetStore({
						assetsDir,
						cacheDir: new URL('./emit-asset/', config.cacheDir),
						logger,
					}),
				};

				if (command === 'dev') {
					updateConfig({ vite: { plugins: [devMiddleware({ assetsDir })] } });
				}
			},

			async 'astro:build:done'({ dir }) {
				await globalThis[NAMESPACE].cache.finalizeBuild(dir);
			},
		},
	} satisfies AstroIntegration;
};

type VitePlugin = NonNullable<AstroConfig['vite']['plugins']>[number];

/**
 * Plugin adding a Vite middleware to serve emitted assets during development.
 */
function devMiddleware({ assetsDir }: { assetsDir: string }) {
	return {
		name: NAMESPACE,
		enforce: 'pre',
		configureServer(server) {
			return () =>
				server.middlewares.use(async (req, res, next) => {
					if (!req.url?.startsWith(assetsDir)) return next();
					if (globalThis[NAMESPACE].cache.hasFile(req.url)) {
						const content = await globalThis[NAMESPACE].cache.getFile(req.url);
						const type = lookup(req.url) || 'text/plain';
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
