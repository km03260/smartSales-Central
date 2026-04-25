// Corrige les variantes dark: qui donnent un contraste insuffisant.
// - text-gray-500 dark:text-gray-400 → dark:text-gray-300 (plus lisible)
// - text-gray-400 dark:text-gray-500 → dark:text-gray-400 (garde le dim mais visible)
// - text-gray-300 dark:text-gray-600 → dark:text-gray-500
// - bg-gray-50 dark:bg-gray-950    → dark:bg-gray-900 (sinon se fond avec le body)
//
// Usage : node scripts/fix-dark-contrast.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src');

const FIXES = [
  // Texte gris secondaire : gray-400 est trop sombre sur un fond gray-900 en dark
  { from: /\bdark:text-gray-400\b/g, to: 'dark:text-gray-300' },
  // Texte gris tertiaire : gray-500 trop proche du fond
  { from: /\bdark:text-gray-500\b/g, to: 'dark:text-gray-400' },
  // Texte quasi-invisible : gray-600 sur fond sombre
  { from: /\bdark:text-gray-600\b/g, to: 'dark:text-gray-500' },
  // Fond de section : gray-950 = identique au body, les sections disparaissent
  { from: /\bdark:bg-gray-950\b/g, to: 'dark:bg-gray-900' },
  // Les bordures très sombres (gray-800) sont quasi invisibles, on remonte à gray-700
  { from: /\bdark:border-gray-800\b/g, to: 'dark:border-gray-700' },
];

function collectFiles(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectFiles(full, exts));
    else if (exts.some(e => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const files = collectFiles(srcDir, ['.astro', '.jsx', '.tsx']);
let total = 0;
for (const f of files) {
  const original = readFileSync(f, 'utf8');
  let content = original;
  for (const { from, to } of FIXES) content = content.replace(from, to);
  if (content !== original) {
    writeFileSync(f, content);
    console.log(`✓ ${f.replace(srcDir, '')}`);
    total++;
  }
}
console.log(`\n${total}/${files.length} files fixed.`);
