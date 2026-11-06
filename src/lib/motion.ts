import { storage } from '@/lib/storage'

const KEY = 'kurio.motion'

// ?motion=off desliga as animações decorativas e fica salvo; ?motion=on volta ao normal
export function initMotion() {
  const fromUrl = new URLSearchParams(location.search).get('motion')
  if (fromUrl === 'on' || fromUrl === 'off') storage.set(KEY, fromUrl)

  if (storage.get(KEY) === 'off') document.documentElement.dataset.motion = 'off'
}
