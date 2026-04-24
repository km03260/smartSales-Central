// Génère 18 covers SVG pour les articles de blog, format 1200×630.
// Charte cohérente : fond dégradé thématique + icône centrale + logo customApps corner.
// Usage : node scripts/generate-blog-covers.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'blog', 'covers');

// Palettes par catégorie (cohérent avec les apps customApps)
const PALETTES = {
  guide:         { start: '#0f172a', end: '#1e3a8a', glow: '#3b82f6', accent: '#60a5fa' },
  actualites:    { start: '#0f172a', end: '#831843', glow: '#ec4899', accent: '#f472b6' },
  'etude-de-cas':{ start: '#0f172a', end: '#064e3b', glow: '#10b981', accent: '#34d399' },
  produit:       { start: '#0f172a', end: '#4c1d95', glow: '#8b5cf6', accent: '#a78bfa' },
  'sous-le-capot':{start: '#0f172a', end: '#7c2d12', glow: '#f97316', accent: '#fb923c' },
};

// 18 articles avec icône centrale (path SVG d="..." de heroicons outline) + titre court visuel
const COVERS = [
  { slug: 'signes-digitaliser-force-de-vente',
    category: 'guide', label: 'Diagnostic',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { slug: 'vrai-cout-processus-commande-papier',
    category: 'guide', label: 'ROI',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { slug: 'pme-industrielle-par-ou-commencer-digitalisation-terrain',
    category: 'guide', label: 'Feuille de route',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { slug: 'app-mobile-metier-vs-desktop',
    category: 'guide', label: 'Mobile vs Desktop',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { slug: 'wavesoft-vs-sage-ebp-ciel',
    category: 'guide', label: 'Comparatif ERP',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { slug: 'comparatif-4-facons-prendre-commande-mobile',
    category: 'guide', label: '4 options',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { slug: 'mode-hors-ligne-comment-ca-marche',
    category: 'sous-le-capot', label: 'Offline-first',
    icon: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829' },
  { slug: 'architecture-sync-cloud-onpremise-hybride',
    category: 'sous-le-capot', label: 'Architecture',
    icon: 'M4 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM4 17a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM9 11h2M9 15h2M9 7h2' },
  { slug: 'etude-cas-maurer-digitalisation-commerciaux',
    category: 'etude-de-cas', label: 'Étude de cas',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { slug: 'combien-coute-app-prise-commandes-mobile',
    category: 'guide', label: 'Tarifs',
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
  { slug: 'checklist-12-questions-editeur-app-metier',
    category: 'guide', label: 'Checklist',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { slug: 'chiffrement-aes-256-architecture-zero-trust',
    category: 'sous-le-capot', label: 'Sécurité',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { slug: 'android-14-15-16-apk-compatible',
    category: 'sous-le-capot', label: 'Android',
    icon: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { slug: 'rgpd-app-metier-garanties-editeur',
    category: 'sous-le-capot', label: 'RGPD',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { slug: 'nouveautes-customapps-v1-2',
    category: 'produit', label: 'Nouveautés v1.2',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { slug: 'lancement-customshipping-pourquoi',
    category: 'produit', label: 'Nouveau',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { slug: 'digitaliser-force-de-vente-benefices',
    category: 'guide', label: 'Bénéfices chiffrés',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { slug: 'installer-apk-android-sans-play-store',
    category: 'guide', label: 'Installation Android',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
];

function svgCover({ slug, category, label, icon }) {
  const p = PALETTES[category] || PALETTES.guide;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.start}"/>
      <stop offset="100%" stop-color="${p.end}"/>
    </linearGradient>
    <radialGradient id="glow-${slug}" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.45"/>
      <stop offset="70%" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="corner-${slug}" cx="100%" cy="0%" r="80%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots-${slug}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#ffffff" fill-opacity="0.06"/>
    </pattern>
    <filter id="blur-${slug}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>

  <!-- Backgrounds -->
  <rect width="1200" height="630" fill="url(#bg-${slug})"/>
  <rect width="1200" height="630" fill="url(#dots-${slug})"/>
  <rect width="1200" height="630" fill="url(#corner-${slug})"/>

  <!-- Glow behind icon -->
  <circle cx="600" cy="315" r="240" fill="url(#glow-${slug})"/>

  <!-- Decorative arcs -->
  <circle cx="600" cy="315" r="200" stroke="${p.accent}" stroke-opacity="0.18" stroke-width="1.5" fill="none"/>
  <circle cx="600" cy="315" r="260" stroke="${p.accent}" stroke-opacity="0.10" stroke-width="1" fill="none"/>
  <circle cx="600" cy="315" r="320" stroke="${p.accent}" stroke-opacity="0.06" stroke-width="1" fill="none"/>

  <!-- Decorative blobs -->
  <circle cx="100" cy="100" r="180" fill="${p.glow}" fill-opacity="0.12" filter="url(#blur-${slug})"/>
  <circle cx="1100" cy="530" r="160" fill="${p.accent}" fill-opacity="0.10" filter="url(#blur-${slug})"/>

  <!-- Central icon in a rounded square -->
  <rect x="480" y="195" width="240" height="240" rx="48" fill="${p.glow}" fill-opacity="0.15"/>
  <rect x="490" y="205" width="220" height="220" rx="42" fill="${p.start}" fill-opacity="0.6"/>
  <rect x="490" y="205" width="220" height="220" rx="42" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="1.5"/>

  <!-- Icon (heroicons outline, scaled/translated to fit 160×160 centered at 600,315) -->
  <g transform="translate(520, 235) scale(6.67)">
    <path d="${icon}" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Category label -->
  <g transform="translate(600, 490)">
    <rect x="-120" y="-20" width="240" height="40" rx="20" fill="#ffffff" fill-opacity="0.1"/>
    <text x="0" y="6" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="16" fill="${p.accent}" letter-spacing="2">${label.toUpperCase()}</text>
  </g>

  <!-- customApps logo corner -->
  <g transform="translate(60, 560)">
    <rect x="0"  y="0"  width="18" height="18" rx="4" fill="${p.accent}"/>
    <rect x="24" y="0"  width="18" height="18" rx="4" fill="${p.accent}" fill-opacity="0.5"/>
    <rect x="0"  y="24" width="18" height="18" rx="4" fill="${p.accent}" fill-opacity="0.5"/>
    <rect x="24" y="24" width="18" height="18" rx="4" fill="${p.accent}"/>
    <text x="54" y="28" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="20" fill="#ffffff" fill-opacity="0.85">customApps</text>
  </g>

  <!-- Subtle badge bottom-right -->
  <g transform="translate(1140, 590)" text-anchor="end">
    <text font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="13" fill="#ffffff" fill-opacity="0.45">blog.customapps.fr</text>
  </g>
</svg>`;
}

for (const cover of COVERS) {
  const svg = svgCover(cover);
  const outPath = join(outDir, `${cover.slug}.svg`);
  writeFileSync(outPath, svg);
  console.log(`✓ ${cover.slug}.svg`);
}

console.log(`\n${COVERS.length} covers generated in ${outDir}`);
