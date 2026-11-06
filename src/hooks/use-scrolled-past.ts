import { useEffect, useState } from 'react'

// o topo do elemento já passou da linha (fração da altura da janela)
export function useScrolledPast(id: string, line = 0.4) {
  const [past, setPast] = useState(false)

  useEffect(() => {
    let frame = 0

    const check = () => {
      frame = 0
      const element = document.getElementById(id)
      setPast(!!element && element.getBoundingClientRect().top <= window.innerHeight * line)
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(check)
    }

    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [id, line])

  return past
}
