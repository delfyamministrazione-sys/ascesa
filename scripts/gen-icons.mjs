import sharp from 'sharp'
import fs from 'node:fs'

const svg = fs.readFileSync('public/icon.svg')

await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(svg).resize(192, 192).png().toFile('public/pwa-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/pwa-512.png')

// maskable: icona rimpicciolita su fondo pieno per rispettare la safe-zone
const inner = await sharp(svg).resize(360, 360).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#111827' } })
  .composite([{ input: inner, gravity: 'centre' }])
  .png()
  .toFile('public/maskable-512.png')

console.log('icons generated')
