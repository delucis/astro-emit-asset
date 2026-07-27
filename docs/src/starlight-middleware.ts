import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { emitAsset } from 'astro-emit-asset/emit';
import sharp from 'sharp';

export const onRequest = defineRouteMiddleware(async ({ url, locals }) => {
	const { title, description } = locals.starlightRoute.entry.data;

	/** A pretty URL to display in OG images, e.g. `"delucis.github.io/astro-emit-asset"` */
	const prettyUrl = url.href.replace(`${url.protocol}//`, '').replace(/\/$/, '');

	// Generate an OpenGraph image for the current page.
	const asset = await emitAsset('og.jpg', [title, description, prettyUrl], async () => {
		/** Padding around the text. */
		const pad = 30;

		/** Main text, using Pango markup for styling. See: https://docs.gtk.org/Pango/pango_markup.html */
		let text = `<span color="#CECDC3" letter_spacing="-1000" weight="900">${title}</span>`;
		if (description) {
			text += `\n<span color="#878580" letter_spacing="-1000" size="100%" weight="100">${description}</span>`;
		}

		/** Text to display in the footer of the image. */
		const footerText = `📤   <span color="#cecdc3" size="small">${prettyUrl}</span>`;

		// Render image buffer with Sharp.
		const data = await sharp({
			create: { width: 1200, height: 630, channels: 3, background: '#100F0F' },
		})
			.composite([
				// Main text.
				{
					input: { text: { text, width: 1000, height: 430, rgba: true } },
					top: pad,
					left: pad,
				},
				// Footer text.
				{
					input: { text: { text: footerText, width: 1000, height: 50, rgba: true } },
					top: 585 - pad,
					left: pad,
				},
			])
			.jpeg()
			.toBuffer();

		return { data };
	});

	// Add OpenGraph meta tags to the page <head>.
	locals.starlightRoute.head.push({
		tag: 'meta',
		attrs: { property: 'og:image', content: new URL(asset.src, url).href },
	});
	locals.starlightRoute.head.push({
		tag: 'meta',
		attrs: { property: 'og:image:alt', content: title + (description ? `: ${description}` : '') },
	});
});
