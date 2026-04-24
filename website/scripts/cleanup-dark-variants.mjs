// Nettoie les duplications de variantes dark: introduites par apply-dark-variants.mjs
// quand les règles en cascade matchaient les classes déjà transformées.
//
// Usage : node scripts/cleanup-dark-variants.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src');

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

// Pour chaque type de classe, garder uniquement la première variant dark: rencontrée
// Patterns pour text-gray, bg-gray, border-gray, text-*, bg-*, border-*
const CLEANUP_PATTERNS = [
  // dark:text-gray-X dark:text-gray-Y [dark:text-gray-Z...] → dark:text-gray-X
  /(\bdark:text-gray-\d+)((?:\s+dark:text-gray-\d+)+)/g,
  // dark:bg-gray-X dark:bg-gray-Y → dark:bg-gray-X
  /(\bdark:bg-gray-\d+)((?:\s+dark:bg-gray-\d+)+)/g,
  // dark:border-gray-X dark:border-gray-Y → dark:border-gray-X
  /(\bdark:border-gray-\d+)((?:\s+dark:border-gray-\d+)+)/g,
  // dark:bg-gray-900 dark:bg-[#0b1220] : garder le plus spécifique (custom) s'il existe
  // On traite ce cas particulier avec dark:bg-[...]
  /(\bdark:bg-gray-\d+)\s+(dark:bg-\[[^\]]+\])/g,  // on keep seulement le custom
];

function cleanup(content) {
  let out = content;
  // Les 3 premiers patterns : garder le $1, drop le reste
  for (let i = 0; i < 3; i++) {
    out = out.replace(CLEANUP_PATTERNS[i], '$1');
  }
  // 4e : si on a dark:bg-gray-XXX suivi de dark:bg-[custom], garder seulement le custom
  out = out.replace(CLEANUP_PATTERNS[3], '$2');
  return out;
}

const files = collectFiles(srcDir, ['.astro', '.jsx', '.tsx']);
let total = 0;
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  const cleaned = cleanup(content);
  if (cleaned !== content) {
    writeFileSync(f, cleaned);
    // Compter le diff approximatif (nombre de caractères en moins)
    const saved = content.length - cleaned.length;
    console.log(`✓ ${f.replace(srcDir, '')} — ${saved} chars cleaned`);
    total++;
  }
}
console.log(`\n${total}/${files.length} files cleaned.`);
