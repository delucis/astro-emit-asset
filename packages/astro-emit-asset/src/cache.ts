import type { AstroIntegrationLogger } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'piccolore';
import type { CachedAsset, EmittedAsset } from './types';

const CACHE_FILE = `cache.json`;

const toAbsolutePath = (file: string, dir: URL): URL => new URL(path.join(dir.toString(), file));

export class AssetStore {
	assetsDir: string;
	#base;
	#cacheDir;
	#cacheFile;
	#logger: AstroIntegrationLogger;
	#assets = new Map<
		string,
		| { src: string; active?: boolean; cached?: boolean }
		| Array<{ src: string; active?: boolean; cached?: boolean }>
	>();
	#files = new Map<string, EmittedAsset<any>>();

	constructor({
		assetsDir,
		base,
		cacheDir,
		logger,
	}: {
		assetsDir: string;
		base: string;
		cacheDir: URL;
		logger: AstroIntegrationLogger;
	}) {
		this.assetsDir = assetsDir;
		this.#base = base;
		this.#cacheDir = cacheDir;
		this.#cacheFile = toAbsolutePath(CACHE_FILE, this.#cacheDir);
		this.#logger = logger;
		this.#deserialize();
	}

	/** Write the current cache state to disk as JSON. */
	async #serialize() {
		try {
			await fs.promises.mkdir(this.#cacheDir, { recursive: true });
			await fs.promises.writeFile(
				this.#cacheFile,
				JSON.stringify({
					assets: [...this.#assets.entries()].map(([key, value]) => [
						key,
						// Strip out the `active` property when serializing to disk.
						Array.isArray(value) ? value.map(({ src }) => ({ src })) : { src: value.src },
					]),
					files: [...this.#files.entries()],
				}),
			);
		} catch {
			// noop
			// warn({ message: 'could not save the cache file', level: this.#logLevel });
		}
	}

	/** Load previous cache state from JSON file on disk. */
	#deserialize() {
		try {
			const str = fs.readFileSync(this.#cacheFile, 'utf-8');
			const { assets, files } = JSON.parse(str) as any;
			this.#assets = new Map(assets);
			this.#files = new Map(files);
		} catch {
			// noop
			// debug({ message: 'no cache file found', level: this.#logLevel });
		}
	}

	/** Copy all active assets to the build output. */
	async finalizeBuild(dir: URL): Promise<void> {
		this.#logger.info(pc.inverse(pc.green(` finalizing emitted assets... `)));
		const t0 = performance.now();

		const activeFiles = [...this.#assets.values()].flat().filter(({ active }) => active);
		const count = activeFiles.length;
		for (let i = 0; i < count; i++) {
			const { src, cached } = activeFiles[i]!;
			const t0 = performance.now();
			const sourceFilePath = toAbsolutePath(src, this.#cacheDir);
			// The build output should not include `base`, so we strip it from the front of asset paths.
			const srcWithoutBase = src.slice(this.#base.length);
			const targetFilePath = toAbsolutePath(srcWithoutBase, dir);
			await fs.promises.mkdir(path.dirname(fileURLToPath(targetFilePath)), { recursive: true });
			await fs.promises.cp(sourceFilePath, targetFilePath);
			const t1 = performance.now();
			this.#logger.info(
				`  ${pc.green('▶')} ` +
					pc.dim(
						`${srcWithoutBase}${cached ? ' (reused cache entry)' : ''} (+${Math.round(t1 - t0)}ms) (${i + 1}/${count})`,
					),
			);
		}

		const t1 = performance.now();
		this.#logger.info(
			pc.green(
				`✓ Completed in ${Math.round(t1 - t0)}ms (${activeFiles.filter(({ cached }) => cached).length}/${count} cached)\n`,
			),
		);
	}

	/**
	 * Get cached asset(s) by hash. Used by `emitAsset()`.
	 * Getting an asset from the cache will mark it as active, so it will be copied to the build output.
	 */
	getAsset(assetHash: string): EmittedAsset<any> | Array<EmittedAsset<any>> | undefined {
		const asset = this.#assets.get(assetHash);

		if (!asset) {
			return undefined;
		}

		if (Array.isArray(asset)) {
			return asset
				.map((a) => {
					// Mark asset as active.
					Object.assign(a, { active: true, cached: true });
					// Return the referenced file.
					return this.#files.get(a.src);
				})
				.filter((file) => file !== undefined);
		} else {
			// Mark asset as active.
			Object.assign(asset, { active: true, cached: true });
			// Return the referenced file.
			return this.#files.get(asset.src);
		}
	}

	/**
	 * Check if a file exists in the cache. Used by dev middleware.
	 */
	hasFile(file: string): boolean {
		return this.#files.has(file);
	}

	/**
	 * Load a cached file so it can be served. Used by dev middleware.
	 */
	async getFile(file: string): Promise<Buffer | undefined> {
		if (!this.#files.has(file)) {
			return undefined;
		}

		try {
			const filepath = toAbsolutePath(file, this.#cacheDir);

			return await fs.promises.readFile(filepath);
		} catch {
			// warn({ message: `could not load cached file for "${file}"`, level: this.#logLevel });
			return undefined;
		}
	}

	/**
	 * Add an asset to the cache so it can be retrieved later. Used by `emitAsset()`.
	 */
	async set(inputHash: string, assets: CachedAsset<any> | Array<CachedAsset<any>>): Promise<void> {
		for (const { src, data, meta } of Array.isArray(assets) ? assets : [assets]) {
			try {
				const filepath = toAbsolutePath(src, this.#cacheDir);
				await fs.promises.mkdir(path.dirname(fileURLToPath(filepath)), { recursive: true });
				await fs.promises.writeFile(filepath, data);

				this.#files.set(src, { src, meta });
			} catch {
				// noop
				// warn({ message: `could not save cached copy of "${file}"`, level: this.#logLevel });
			}
		}

		this.#assets.set(
			inputHash,
			Array.isArray(assets)
				? assets.map((asset) => ({ src: asset.src, active: true }))
				: { src: assets.src, active: true },
		);

		await this.#serialize();
	}
}
