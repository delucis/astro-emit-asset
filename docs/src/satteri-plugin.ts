import { emitAsset } from 'astro-emit-asset/emit';
import { defineMdastPlugin } from 'satteri';

const titleRegExp = /title="([^"]+?)"/;

export const satteriMdastCodeBlockEmitter = defineMdastPlugin({
	name: 'astro-emit-asset-test',
	async code(node, context) {
		if (!node.lang || !node.meta?.includes('download')) {
			return;
		}
		const fileName = node.meta.match(titleRegExp)?.[1];
		const asset = await emitAsset(fileName || `code.${node.lang}`, [node.value], () => ({
			data: node.value,
		}));
		context.insertAfter(node, {
			type: 'paragraph',
			children: [
				{
					type: 'link',
					url: asset.src,
					data: {
						hProperties: {
							download: fileName || '',
							style: `padding: 0.75em; background-color: var(--sl-color-gray-6); box-shadow: var(--sl-flexoki-emboss-shadow); border-radius: 0.5em; text-decoration: none;`,
						},
					},
					children: [{ type: 'text', value: `⬇️ Download ${fileName || 'code'}` }],
				},
			],
		});
	},
});
