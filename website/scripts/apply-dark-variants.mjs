// Applique les variants dark:X sur les classes Tailwind les plus courantes
// dans les fichiers du site. Idempotent : détecte si la variant est déjà présente.
//
// Usage : node scripts/apply-dark-variants.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src');

// Patterns : [classe light, classe dark à ajouter]
// Ordre important : on fait les plus spécifiques d'abord pour éviter double-remplacement
const RULES = [
  // Backgrounds
  { light: 'bg-white',     dark: 'dark:bg-gray-900' },
  { light: 'bg-gray-50',   dark: 'dark:bg-gray-950' },
  { light: 'bg-gray-100',  dark: 'dark:bg-gray-800' },
  // Textes
  { light: 'text-gray-900', dark: 'dark:text-gray-100' },
  { light: 'text-gray-700', dark: 'dark:text-gray-200' },
  { light: 'text-gray-600', dark: 'dark:text-gray-300' },
  { light: 'text-gray-500', dark: 'dark:text-gray-400' },
  { light: 'text-gray-400', dark: 'dark:text-gray-500' },
  { light: 'text-gray-300', dark: 'dark:text-gray-600' },
  // Borders
  { light: 'border-gray-100', dark: 'dark:border-gray-800' },
  { light: 'border-gray-200', dark: 'dark:border-gray-700' },
  { light: 'border-gray-300', dark: 'dark:border-gray-600' },
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

function applyTo(file) {
  let content = readFileSync(file, 'utf8');
  const original = content;
  let replacements = 0;

  for (const { light, dark } of RULES) {
    // Match la classe précédée par espace ou " ou début de string/attribute
    // suivie par un espace, ", ` ou fin — pour éviter les matchs partiels (ex: "bg-white" dans "bg-white-200")
    // Pattern : \b{light}(?!\S)  et on vérifie que la variant dark n'est pas déjà présente juste après
    const regex = new RegExp(`\\b${light.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?=["'\` \\n\\t}])`, 'g');
    content = content.replace(regex, (match, offset) => {
      // Check if the dark variant is already present nearby (within 300 chars)
      const window = content.slice(offset, offset + 300);
      if (window.includes(dark)) return match; // déjà présent
      replacements++;
      return `${match} ${dark}`;
    });
  }

  if (content !== original) {
    writeFileSync(file, content);
    console.log(`✓ ${file.replace(srcDir, '')} — ${replacements} variants ajoutés`);
  }
}

const files = collectFiles(srcDir, ['.astro', '.jsx', '.tsx']);
console.log(`Applying dark variants on ${files.length} files...\n`);
for (const f of files) applyTo(f);
console.log('\nDone.');
