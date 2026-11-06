import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FeaturedItem } from '@/domain/catalog/schema'
import { imageSrcSet } from '@/lib/images'
import type { HeroSlideContent } from './hero-slides'

interface HeroSlideProps {
  content: HeroSlideContent
  item?: FeaturedItem
  extra?: FeaturedItem
  isPending: boolean
  priority: boolean
}

function HeroSlide({ content, item, extra, isPending, priority }: HeroSlideProps) {
  return (
    <>
      <div className="grid grid-rows-[auto_1fr_auto] md:grid-rows-[3fr_4fr_3fr] md:pl-10">
        <p className="pb-3 text-xs motion-safe:animate-copy-reveal md:self-end md:pb-6">Bem-vindo à Kurio</p>

        <div>
          <h2 className="text-3xl leading-snug font-bold whitespace-pre-line uppercase motion-safe:animate-copy-reveal [--delay:0.11s] max-md:text-lg md:text-[2rem] md:leading-[1.4]">
            <span className="md:hidden">{content.compact.title}</span>
            <span className="max-md:hidden">{content.title}</span>
          </h2>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-text-secondary md:mt-6 motion-safe:animate-copy-reveal [--delay:0.22s]">
            <span className="md:hidden">{content.compact.text}</span>
            <span className="max-md:hidden">{content.text}</span>
          </p>
        </div>

        <div className="pt-3 md:pt-8">
          <Button asChild size="lg" className="px-6 uppercase motion-safe:animate-copy-reveal [--delay:0.22s] max-md:h-auto max-md:px-0 max-md:bg-transparent max-md:text-text-accent max-md:hover:bg-transparent">
            <Link to="/" search={content.search} hash="catalogo">
              {content.cta} <ArrowRight className="md:hidden" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative self-center motion-safe:animate-fan-in">
        {isPending && <Skeleton className="aspect-square w-full" />}
        {item && (
          <Link
            to="/nft/$id"
            params={{ id: item.nft.id }}
            className="block md:tilt rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <img
              src={item.nft.image.url}
              srcSet={imageSrcSet(item.nft.image)}
              sizes="(min-width: 1024px) 30rem, (min-width: 768px) 26rem, 8rem"
              width={item.nft.image.width}
              height={item.nft.image.height}
              alt={item.nft.name}
              fetchPriority={priority ? 'high' : undefined}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </Link>
        )}
        {extra && (
          <img
            src={extra.nft.image.url}
            alt=""
            aria-hidden
            width={96}
            height={96}
            loading="lazy"
            className="absolute -bottom-4 left-3 size-16 rounded-xl  object-cover md:hidden"
          />
        )}
      </div>
    </>
  )
}

export default HeroSlide
