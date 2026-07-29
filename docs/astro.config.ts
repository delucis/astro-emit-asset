import { satteri } from '@astrojs/markdown-satteri';
import starlight from '@astrojs/starlight';
import emitAsset from 'astro-emit-asset';
import { defineConfig } from 'astro/config';
import starlightThemeFlexoki from 'starlight-theme-flexoki';
import { satteriMdastCodeBlockEmitter } from './src/satteri-plugin';

export default defineConfig({
	site: 'https://delucis.github.io/',
	base: '/astro-emit-asset/',
	integrations: [
		emitAsset(),
		starlight({
			title: 'Astro Emit Asset',
			social: [
				{
					href: 'https://github.com/delucis/astro-emit-asset',
					icon: 'github',
					label: 'GitHub repository',
				},
				{
					href: 'https://npmx.dev/package/astro-emit-asset',
					icon: 'npm',
					label: 'Package on NPMX',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/delucis/astro-emit-asset/edit/main/docs/',
			},
			sidebar: ['', 'getting-started', 'examples', 'for-integrations'],
			plugins: [starlightThemeFlexoki({ accentColor: 'blue' })],
			routeMiddleware: './src/starlight-middleware.ts',
			components: {
				SocialIcons: './src/components/SocialIcons.astro',
			},
			expressiveCode: {
				shiki: { langAlias: { svg: 'xml' } },
			},
		}),
	],
	markdown: {
		processor: satteri({
			mdastPlugins: [satteriMdastCodeBlockEmitter],
		}),
	},
	experimental: {
		contentIntellisense: true,
	},
});
