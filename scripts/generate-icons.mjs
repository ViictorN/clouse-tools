// Renders the PWA/app icon set as static PNGs into public/.
// Run with `npm run icons` (also wired into prebuild) after changing app/icon.tsx.
import { ImageResponse } from 'next/og.js';
import { createElement } from 'react';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function iconMarkup(size) {
  const radius = Math.round(size * 0.22);
  const svgSize = Math.round(size * 0.58);
  return createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 50% 18%, rgba(0, 113, 227, 0.35) 0%, transparent 62%), #0b0b0e',
        borderRadius: radius,
        border: `${Math.max(1, Math.round(size * 0.012))}px solid rgba(255, 255, 255, 0.22)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
      },
    },
    createElement(
      'svg',
      {
        width: svgSize,
        height: svgSize,
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
      },
      createElement('path', {
        d: 'M17 3.5C14.5 1.5 11 1.8 8.8 4L4 8.8C1.8 11 1.5 14.5 3.5 17C5.5 19.5 9 19.2 11.2 17L16 12.2C18.2 10 18.5 6.5 16.5 4',
        stroke: '#ffffff',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      createElement('path', {
        d: 'M14.5 14.5L19.5 19.5',
        stroke: '#ffffff',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
      }),
      createElement('circle', {
        cx: 9,
        cy: 9,
        r: 1.5,
        fill: '#ffffff',
      }),
    ),
  );
}

async function writeIcon(size, filename) {
  const png = await new ImageResponse(iconMarkup(size), { width: size, height: size }).arrayBuffer();
  await writeFile(resolve(root, 'public', filename), Buffer.from(png));
  return filename;
}

await mkdir(resolve(root, 'public'), { recursive: true });
const written = await Promise.all([
  writeIcon(192, 'icon-192.png'),
  writeIcon(512, 'icon-512.png'),
  writeIcon(180, 'apple-touch-icon.png'),
]);
console.log(`Wrote: ${written.join(', ')}`);
