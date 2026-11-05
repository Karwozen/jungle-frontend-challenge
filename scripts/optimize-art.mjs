import sharp from 'sharp'
import { log } from 'node:console'
import { existsSync } from 'node:fs'
for (const name of ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat']) {
  const input = `public/assets/art/${name}-original.png`
  if (!existsSync(input)) continue
  await Promise.all([480, 960].map(size => sharp(input).resize(size, size, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 86 }).toFile(`public/assets/art/${name}-${size}.webp`)))
  log(`Optimized: ${name}`)
}
