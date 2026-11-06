import { useState } from 'react'
import { Artwork } from './Artwork'

// Editorial selections are local; prices and availability still come from the catalog API.
const artworks = [
  { name: 'Emerald Ape #042', artwork: '/assets/art/emerald-ape' },
  { name: 'Sage Nomad #009', artwork: '/assets/art/sage-nomad' },
  { name: 'Neon Vessel #052', artwork: '/assets/art/neon-vessel' },
]

export function FeaturedArtwork() {
  const [selected, setSelected] = useState(0)
  return <div className="hero-featured" role="group" aria-label="Artes em destaque">
    <div className="hero-art" aria-live="polite"><Artwork nft={artworks[selected]} priority large sizes="(max-width: 700px) calc(40vw - 19.2px), (max-width: 1100px) calc(40vw - 27.2px), 450px"/></div>
    <img className="hero-inset" src="/assets/art/sage-nomad-480.webp" alt="" width={480} height={480} loading="lazy"/>
    <div className="hero-controls">
      {artworks.map(({ name }, index) => (
        <button key={name} type="button" aria-label={`Mostrar ${name}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><span aria-hidden="true"/></button>
      ))}
    </div>
  </div>
}
