import { NAMESPACE } from './constants';
import { deterministicString } from './deterministic-string';
import { hash } from './hash';
import type { CachedAsset, EmittedAsset, GeneratedAsset } from './types';

declare var globalThis: {
	[NAMESPACE]: {
		cache: import('./cache').AssetStore;
	};
};

/**
 * Create an asset path name, including assets directory prefix.
 *
 * @example
 * generateName('my.svg', 'abc123') // returns '/_astro/my.abc123.svg'
 * generateName('my.svg', 'abc123', 0) // returns '/_astro/my.0.abc123.svg'
 * generateName('my', 'abc123') // returns '/_astro/my-abc123'
 * generateName('my', 'abc123', 0) // returns '/_astro/my-0-abc123'
 * generateName('custom--[hash]--position.css', 'abc123') // returns '/_astro/custom--abc123--position.css'
 */
function generateName(path: string, hash: string, index?: number): string {
	const dotIndex = path.lastIndexOf('.');
	const hasDot = dotIndex !== -1;
	const replacement = (index !== undefined ? [index, hash] : [hash]).join(hasDot ? '.' : '-');
	if (path.includes('[hash]')) {
		path = path.replaceAll('[hash]', replacement);
	} else {
		if (hasDot) {
			path = `${path.slice(0, dotIndex)}.${replacement}${path.slice(dotIndex)}`;
		} else {
			path = `${path}-${replacement}`;
		}
	}
	return `${globalThis[NAMESPACE].cache.assetsDir}${path}`;
}

// Single asset overload
export async function emitAsset<T extends undefined | Record<string, unknown> = undefined>(
	path: string,
	cacheKey: unknown,
	generateAsset: () => GeneratedAsset<T> | Promise<GeneratedAsset<T>>,
): Promise<EmittedAsset<T>>;
// Multiple asset overload
export async function emitAsset<T extends undefined | Record<string, unknown> = undefined>(
	path: string,
	cacheKey: unknown,
	generateAsset: () => Array<GeneratedAsset<T>> | Promise<Array<GeneratedAsset<T>>>,
): Promise<Array<EmittedAsset<T>>>;
/**
 * Emits an asset to be loaded from your site.
 *
 * @param path The basic file name for your asset. This will be transformed into a unique file name
 * including a hash. Use the `src` returned by `emitAsset()` to load the asset in your site.
 * @param cacheKey Any dependencies of your asset generation function. These will be used to
 * generate the file hash and determine if the asset needs to be regenerated.
 * @param generateAsset A function that generates the asset.
 *
 * It should return an object with a `data` property containing the file data, and an optional
 * `meta` property containing any metadata you want to associate with the asset.
 *
 * You can also return an array of objects if there are multiple files associated with this asset.
 * Each file will receive a numbered file name.
 *
 * @example
 * const asset = await emitAsset('my.svg', null, () => ({
 *   data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">)
 *     <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
 *   </svg>`,
 *   meta: {
 *     width: 100,
 *     height: 100,
 *   },
 * }));
 *
 * <img src={asset.src} alt="Generated SVG" width={asset.meta.width} height={asset.meta.height} />
 */
export async function emitAsset<T extends undefined | Record<string, unknown> = undefined>(
	path: string,
	cacheKey: unknown,
	generateAsset: () =>
		| GeneratedAsset<T>
		| Array<GeneratedAsset<T>>
		| Promise<GeneratedAsset<T> | Array<GeneratedAsset<T>>>,
): Promise<Array<EmittedAsset<T>> | EmittedAsset<T>> {
	const inputHash = hash(
		globalThis[NAMESPACE].cache.assetsDir +
			path +
			deterministicString(cacheKey) +
			deterministicString(generateAsset),
	);

	const cached = globalThis[NAMESPACE].cache.getAsset(inputHash);
	if (cached) {
		return cached;
	}

	const generated = await generateAsset();

	if (Array.isArray(generated)) {
		const output: Array<CachedAsset<T>> = generated.map((asset, i) => ({
			src: generateName(path, inputHash, i),
			data: asset.data,
			meta: asset.meta!,
		}));

		await globalThis[NAMESPACE].cache.set(inputHash, output);

		return output;
	} else {
		const output: CachedAsset<T> = {
			src: generateName(path, inputHash),
			data: generated.data,
			meta: generated.meta!,
		};

		await globalThis[NAMESPACE].cache.set(inputHash, output);

		return output;
	}
}
