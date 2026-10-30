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
  const fontSize = Math.round(size * 0.62);
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
        color: 'white',
        fontFamily: 'sans-serif',
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.04em',
        borderRadius: radius,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
      },
    },
    'C',
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
