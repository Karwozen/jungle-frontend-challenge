import { z } from 'zod'

export const ethAmount = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')

export const isoDate = z.iso.datetime()

export const image = z.object({
  url: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  variants: z.array(z.object({ url: z.string(), width: z.number().int().positive() })),
})

export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
}

export const apiErrorBody = z.object({
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
  details: z.unknown().optional(),
})

export type Image = z.infer<typeof image>
