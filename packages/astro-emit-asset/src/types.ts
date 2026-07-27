type AssetFileContents = string | NodeJS.ArrayBufferView;

/** User-generated asset shape. */
export interface GeneratedAsset<T extends undefined | Record<string, unknown>> {
	data: AssetFileContents;
	meta?: T;
}

/** Full asset passed to the asset store when `emitAsset()` generates an asset. */
export interface CachedAsset<T extends undefined | Record<string, unknown>> {
	src: string;
	data: AssetFileContents;
	meta: T;
}

/** Asset object returned by `emitAsset()`. */
export interface EmittedAsset<T extends undefined | Record<string, unknown>> {
	src: string;
	meta: T;
}
