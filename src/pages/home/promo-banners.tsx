import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import Reveal from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'

const banners = [
  {
    image: '/images/nfts/emerald-640.webp',
    alt: 'Macaco de óculos escuros e jaqueta verde',
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { tab: 'new' as const },
  },
  {
    image: '/images/nfts/onyx-640.webp',
    alt: 'Gorila de gola alta e brinco',
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    search: { categories: ['digital-art' as const] },
  },
]

function PromoBanners() {
  return (
    <section aria-label="Explorar" className="mx-auto mt-24 grid w-full max-w-300 gap-6 px-6 lg:grid-cols-2 xl:px-0">
      {banners.map((banner, i) => (
        <Reveal key={banner.title} variant="mask" delay={i * 110}>
          <article className="grid grid-cols-2 items-center overflow-hidden rounded-lg bg-card">
            <div className="group h-full overflow-hidden">
              <img
                src={banner.image}
                alt={banner.alt}
                width={640}
                height={640}
                fetchPriority="low"
                className="size-full object-cover parallax-y transition-transform duration-300 motion-safe:group-hover:scale-[1.3]"
              />
            </div>
            <div className="p-3 text-right sm:p-6 sm:text-left">
              <h2 className="text-xs font-bold sm:text-sm">{banner.title}</h2>
              <p className="mt-2 text-tiny leading-relaxed text-text-secondary sm:mt-3 sm:text-xs">{banner.text}</p>
              <div className="mt-3 flex justify-end sm:mt-4">
                <Button asChild size="lg" className="max-sm:h-7 max-sm:text-xs">
                  <Link to="/" search={banner.search} hash="catalogo">
                    Explorar <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </Reveal>
      ))}
    </section>
  )
}

export default PromoBanners
