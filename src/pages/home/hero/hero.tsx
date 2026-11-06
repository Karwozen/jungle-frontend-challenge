import { useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { featuredQuery } from '@/domain/catalog/queries'
import { useSwipe } from '@/hooks/use-swipe'
import { cn } from '@/lib/utils'
import HeroSlide from './hero-slide'
import { heroSlides } from './hero-slides'

const total = heroSlides.length

function positionOf(slide: number, current: number) {
  const distance = (slide - current + total) % total
  return distance > total / 2 ? distance - total : distance
}

function Hero() {
  const { data, isPending } = useQuery(featuredQuery)
  const [{ index, previous }, setPosition] = useState({ index: 0, previous: 0 })

  const goTo = (next: number) => setPosition((p) => ({ index: (next + total) % total, previous: p.index }))
  const { offset, dragging, handlers } = useSwipe((direction) => goTo(index + direction))

  const onDotsKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') goTo(index + 1)
    if (event.key === 'ArrowLeft') goTo(index - 1)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques"
      className="relative mx-auto mt-8 w-full max-w-300 px-6 md:mt-12 xl:px-0"
    >
      <div className="relative max-md:overflow-hidden max-md:rounded-3xl md:overflow-x-clip">
        <div
          {...handlers}
          onDragStart={(event) => event.preventDefault()}
          className={cn('grid touch-pan-y select-none', dragging && 'cursor-grabbing')}
        >
          {heroSlides.map((content, i) => {
            const position = positionOf(i, index)
            // Suprime a transição no slide que reposiciona de uma extremidade à outra do loop circular
            const animate = !dragging && Math.abs(position - positionOf(i, previous)) <= 1

            return (
              <div
                key={content.title}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total}`}
                inert={i !== index}
                style={{ transform: `translateX(calc(${position * 100}% + ${offset}px))` }}
                className={cn(
                  'col-start-1 row-start-1 grid grid-cols-[1fr_8rem] gap-4 max-md:bg-hero-circles max-md:px-5 max-md:pt-2 max-md:pb-7 md:grid-cols-[1fr_26rem] md:grid-rows-1 md:items-stretch md:gap-8 lg:grid-cols-[1fr_30rem]',
                  animate && 'transition-transform duration-500 ease-out-expo motion-reduce:transition-none',
                )}
              >
                <HeroSlide
                  content={content}
                  item={data?.[i]}
                  extra={data?.[(i + 1) % total]}
                  isPending={isPending}
                  priority={i === 0}
                />
              </div>
            )
          })}
        </div>

        <div
          onKeyDown={onDotsKeyDown}
          className="mt-6 flex justify-center gap-2 max-md:relative max-md:-mt-6 max-md:pb-4 xl:absolute xl:inset-x-0 xl:bottom-2 xl:mt-0"
        >
          {heroSlides.map((content, i) => (
            <button
              key={content.title}
              type="button"
              aria-label={`Mostrar slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={cn(
                'size-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                i === index ? 'bg-text-accent' : 'bg-border-soft',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
