import type { Image } from '@/domain/common/schema'

export function imageSrcSet(image: Image) {
  return image.variants.map((v) => `${v.url} ${v.width}w`).join(', ')
}
