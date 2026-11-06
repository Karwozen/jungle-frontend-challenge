import { useState } from 'react'
import { ZoomIn } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Nft } from '@/domain/catalog/schema'
import { imageSrcSet } from '@/lib/images'
import { cn } from '@/lib/utils'

function Gallery({ nft }: { nft: Nft }) {
  const [selected, setSelected] = useState(0)
  const image = nft.gallery[selected]

  return (
    <div className="flex gap-4 md:gap-5">
      {nft.gallery.length > 1 && (
        <ul className="hidden flex-col gap-3 md:flex" aria-label="Imagens do NFT">
          {nft.gallery.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={i === selected}
                onClick={() => setSelected(i)}
                className={cn(
                  'block overflow-hidden rounded-md border-2 border-transparent outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  i === selected && 'border-primary',
                )}
              >
                <img src={item.variants[0]?.url ?? item.url} alt="" width={96} height={96} className="size-24 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative h-fit flex-1 md:rounded-lg md:bg-card md:p-5">
        <Dialog>
          <DialogTrigger
            aria-label={`Ampliar imagem de ${nft.name}`}
            className="block w-full cursor-zoom-in rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <img
              src={image.url}
              srcSet={imageSrcSet(image)}
              sizes="(min-width: 768px) 32rem, 100vw"
              width={image.width}
              height={image.height}
              alt=""
              fetchPriority="high"
              className="w-full rounded-lg object-cover object-top max-md:aspect-[361/350] max-md:rounded-3xl md:aspect-square"
            />
          </DialogTrigger>
          <DialogContent className="w-fit max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-fit">
            <DialogTitle className="sr-only">{nft.name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
            <img
              src={image.url}
              srcSet={imageSrcSet(image)}
              sizes="90vw"
              alt={nft.name}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
        <ZoomIn aria-hidden className="pointer-events-none absolute top-8 right-8 size-9 rounded-full bg-background/80 p-2.5 max-md:hidden" />
      </div>
    </div>
  )
}

export default Gallery
