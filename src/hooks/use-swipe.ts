import { useRef, useState, type PointerEvent } from 'react'

const START_DISTANCE = 8
const MAX_COMMIT_DISTANCE = 60

// Gesto horizontal de arraste preservando a rolagem vertical nativa do navegador (touch-action: pan-y)
export function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const origin = useRef<{ id: number; x: number; y: number } | null>(null)
  const latest = useRef(0)

  const release = (event: PointerEvent<HTMLElement>) => {
    if (origin.current?.id !== event.pointerId) return
    origin.current = null
    if (!dragging) return

    const threshold = Math.min(event.currentTarget.offsetWidth * 0.2, MAX_COMMIT_DISTANCE)
    if (Math.abs(latest.current) > threshold) onSwipe(latest.current < 0 ? 1 : -1)
    setDragging(false)
    setOffset(0)
  }

  return {
    offset,
    dragging,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        origin.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        latest.current = 0
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const start = origin.current
        if (start?.id !== event.pointerId) return

        const dx = event.clientX - start.x
        if (!dragging) {
          if (Math.abs(dx) < START_DISTANCE) return
          if (Math.abs(event.clientY - start.y) > Math.abs(dx)) {
            origin.current = null
            return
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
        }
        latest.current = dx
        setOffset(dx)
      },
      onPointerUp: release,
      onPointerCancel: release,
    },
  }
}
