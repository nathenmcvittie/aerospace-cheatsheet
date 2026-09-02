// Generates assets/icon.png — the extension's Raycast icon.
// The mark is the layout this extension exists to teach: one full-height strip on
// the left, a stack of two beside it. Same visual grammar as the diagrams.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const S = 512, PAD = 78, R = 34, GAP = 20;
const inner = S - PAD * 2;
const leftW = inner * 0.42;
const rightX = PAD + leftW + GAP;
const rightW = inner - leftW - GAP;
const halfH = (inner - GAP) / 2;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2b8cff"/><stop offset="1" stop-color="#0a5fd0"/>
  </linearGradient></defs>
  <rect width="${S}" height="${S}" rx="112" fill="url(#g)"/>
  <rect x="${PAD}" y="${PAD}" width="${leftW}" height="${inner}" rx="${R}" fill="#fff" fill-opacity="0.95"/>
  <rect x="${rightX}" y="${PAD}" width="${rightW}" height="${halfH}" rx="${R}" fill="#fff" fill-opacity="0.62"/>
  <rect x="${rightX}" y="${PAD + halfH + GAP}" width="${rightW}" height="${halfH}" rx="${R}" fill="#fff" fill-opacity="0.62"/>
</svg>`;
writeFileSync(join(HERE, '..', 'assets', 'icon.svg'), svg, 'utf8');
console.log('wrote assets/icon.svg');
