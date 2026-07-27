import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { emitAsset } from 'astro-emit-asset/emit';
import sharp from 'sharp';

export const onRequest = defineRouteMiddleware(async ({ url, locals }) => {
	const { title, description } = locals.starlightRoute.entry.data;

	/** A pretty URL to display in OG images, e.g. `"delucis.github.io/astro-emit-asset"` */
	const prettyUrl = url.href.replace(`${url.protocol}//`, '').replace(/\/$/, '');

	// Generate an OpenGraph image for the current page.
	const asset = await emitAsset('og.jpg', [title, description, prettyUrl], async () => {
		const [width, height] = [1200, 630];
		/** Padding around the text. */
		const pad = 35;
		/** Right margin. */
		const rightMargin = 140;
		/** Text width. */
		const textWidth = width - pad * 2 - rightMargin;

		/** Main text, using Pango markup for styling. See: https://docs.gtk.org/Pango/pango_markup.html */
		let text = `<span color="#CECDC3" letter_spacing="-1000" weight="700">${title}</span>`;
		if (description) {
			text += `\n<span color="#878580" letter_spacing="-1000" size="100%" weight="300">${description}</span>`;
		}

		/** Text to display in the footer of the image. */
		const footerText = `📤   <span color="#cecdc3" size="small">${prettyUrl}</span>`;

		// Render image buffer with Sharp.
		const data = await sharp({
			create: { width, height, channels: 3, background: '#100F0F' },
		})
			.composite([
				// Main text.
				{
					input: { text: { text, width: textWidth, height: 430, rgba: true } },
					top: pad,
					left: pad,
				},
				// Footer text.
				{
					input: { text: { text: footerText, width: textWidth, height: 50, rgba: true } },
					top: 585 - pad,
					left: pad,
				},
				// Right-hand side coloured band.
				{
					input: { create: { width: rightMargin, height, channels: 3, background: '#205EA6' } },
					gravity: 'east',
				},
				{
					input: {
						create: {
							width: Math.round(rightMargin / 3),
							height,
							channels: 3,
							background: '#4385BE',
						},
					},
					gravity: 'east',
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
