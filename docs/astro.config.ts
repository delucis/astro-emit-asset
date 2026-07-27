import starlight from '@astrojs/starlight';
import emitAsset from 'astro-emit-asset';
import { defineConfig } from 'astro/config';
import starlightThemeFlexoki from 'starlight-theme-flexoki';

export default defineConfig({
	integrations: [
		emitAsset(),
		starlight({
			title: 'Astro Emit Asset',
			social: [
				{ href: 'https://github.com/delucis/astro-emit-asset', icon: 'github', label: 'GitHub' },
			],
			editLink: {
				baseUrl: 'https://github.com/delucis/astro-emit-asset/edit/main/docs/',
			},
			sidebar: ['', 'getting-started', 'examples'],
			plugins: [starlightThemeFlexoki({ accentColor: 'blue' })],
		}),
	],
	experimental: {
		contentIntellisense: true,
	},
});
