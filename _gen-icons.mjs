import sharp from 'sharp'
import { writeFileSync } from 'fs'

// Plexus glyph (matches favicon.svg) — nodes + links on deep indigo.
const glyph = `
  <g stroke="#b9b2e0" stroke-width="2.2" stroke-linecap="round" opacity="0.55">
    <line x1="16" y1="19" x2="48" y2="13"/>
    <line x1="48" y1="13" x2="52" y2="45"/>
    <line x1="52" y1="45" x2="21" y2="51"/>
    <line x1="21" y1="51" x2="16" y2="19"/>
    <line x1="16" y1="19" x2="35" y2="32"/>
    <line x1="48" y1="13" x2="35" y2="32"/>
    <line x1="52" y1="45" x2="35" y2="32"/>
    <line x1="21" y1="51" x2="35" y2="32"/>
  </g>
  <circle cx="16" cy="19" r="6.2" fill="#e06a4f"/>
  <circle cx="48" cy="13" r="6.2" fill="#22a8a1"/>
  <circle cx="52" cy="45" r="6.2" fill="#5a86e0"/>
  <circle cx="21" cy="51" r="6.2" fill="#a877dd"/>
  <circle cx="35" cy="32" r="4.2" fill="#f2f1fb"/>`

// Rounded-corner icon (Android "any", favicon-style).
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1b1c2e"/>${glyph}</svg>`
// Full-bleed square (apple-touch — iOS rounds it itself; no transparency).
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1b1c2e"/>${glyph}</svg>`
// Maskable — full bleed + glyph scaled into the 80% safe zone.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1b1c2e"/><g transform="translate(32,32) scale(0.75) translate(-32,-32)">${glyph}</g></svg>`

async function png(svg, size, out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log('wrote', out, size + 'x' + size)
}
await png(rounded, 192, 'public/icons/icon-192.png')
await png(rounded, 512, 'public/icons/icon-512.png')
await png(maskable, 512, 'public/icons/icon-maskable-512.png')
await png(square, 180, 'public/icons/apple-touch-icon.png')
await png(square, 32, 'public/icons/favicon-32.png')
