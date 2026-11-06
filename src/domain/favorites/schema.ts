import { z } from 'zod'

export const favorites = z.object({ nftIds: z.array(z.string()) })

export type Favorites = z.infer<typeof favorites>
