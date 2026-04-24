// Convertit public/og-default.svg en public/og-default.png (1200×630)
// Usage : node scripts/convert-og.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const input = join(publicDir, 'og-default.svg');
const output = join(publicDir, 'og-default.png');

const svg = readFileSync(input);
const png = await sharp(svg, { density: 300 })
  .resize(1200, 630, { fit: 'cover' })
  .png({ quality: 90, compressionLevel: 9 })
  .toBuffer();

writeFileSync(output, png);
console.log(`✓ Généré ${output} (${(png.length / 1024).toFixed(1)} Ko)`);
