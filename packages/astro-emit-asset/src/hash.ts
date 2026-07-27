const dictionary = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY';
const binary = dictionary.length;
/**
 * Computes a 32-bit integer hash of the input.
 * @param data The input to hash
 * @returns The 32-bit integer hash of the input
 */
function bitwise(str: string): number {
	let hash = 0;
	if (str.length === 0) return hash;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		hash = (hash << 5) - hash + ch;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
	// // OLD implementation that supported NodeJS.ArrayBufferView
	// let hash = 0;
	// if (typeof data === 'string') {
	// 	data = new TextEncoder().encode(data);
	// }
	// if (data.byteLength === 0) return hash;
	// const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	// for (let i = 0; i < view.byteLength; i++) {
	// 	const ch = view.getUint8(i);
	// 	hash = (hash << 5) - hash + ch;
	// 	hash = hash & hash; // Convert to 32-bit integer
	// }
	// return hash;
}

/**
 * Computes a hash string for the given input using a custom dictionary.
 * @param data The input to hash
 * @returns The hash string of the input
 */
export function hash(data: string): string {
	let num;
	let result = '';

	let integer = bitwise(data);
	const sign = integer < 0 ? 'Z' : ''; // If it's negative, start with Z, which isn't in the dictionary

	integer = Math.abs(integer);

	while (integer >= binary) {
		num = integer % binary;
		integer = Math.floor(integer / binary);
		result = dictionary[num] + result;
	}

	if (integer > 0) {
		result = dictionary[integer] + result;
	}

	return sign + result;
}
