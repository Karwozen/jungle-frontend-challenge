import { HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ErrorCode } from '@/lib/http'

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  extra: { fields?: Record<string, string>; details?: unknown } = {},
) {
  return HttpResponse.json({ status, code, message, ...extra }, { status })
}

export const notFound = (what = 'Recurso') =>
  apiError(404, 'NOT_FOUND', `${what} não encontrado.`)

export function validationError(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    fields[key] ??= issue.message
  }
  return apiError(422, 'VALIDATION', 'Revise os campos destacados.', { fields })
}
