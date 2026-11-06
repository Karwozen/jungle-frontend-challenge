import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  variant?: 'fade' | 'slide' | 'mask'
  delay?: number
  className?: string
  children: ReactNode
}

// Anima a entrada dos blocos ao entrarem na viewport, respeitando prefers-reduced-motion via CSS
function Reveal({ variant = 'slide', delay = 0, className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || shown) return

    const show = () => setShown(true)
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && show(), {
      rootMargin: '0px 0px -10% 0px',
    })
    observer.observe(element)

    // Garante exibição imediata caso um salto rápido de rolagem ultrapasse o elemento
    const onScroll = () => element.getBoundingClientRect().top < 0 && show()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [shown])

  return (
    <div
      ref={ref}
      data-reveal={variant}
      data-shown={shown ? '' : undefined}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
      className={className}
    >
      {children}
    </div>
  )
}

export default Reveal
