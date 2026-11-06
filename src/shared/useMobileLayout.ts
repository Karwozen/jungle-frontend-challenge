import { useSyncExternalStore } from 'react'

const mobileLayout = '(max-width: 700px)'
const readLayout = () => window.matchMedia(mobileLayout).matches

function subscribeToLayout(update: () => void) {
  const media = window.matchMedia(mobileLayout)
  media.addEventListener('change', update)
  return () => media.removeEventListener('change', update)
}

export function useMobileLayout() {
  return useSyncExternalStore(subscribeToLayout, readLayout)
}
