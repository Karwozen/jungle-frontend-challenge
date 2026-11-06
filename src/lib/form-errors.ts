import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/lib/http'

// erro por campo vindo da API aparece no campo; o resto vira mensagem do formulário
export function applyApiError<T extends FieldValues>(setError: UseFormSetError<T>, error: unknown) {
  if (!(error instanceof ApiError)) {
    setError('root', { message: 'Algo deu errado. Tente novamente.' })
    return
  }

  const fields = Object.entries(error.fields)
  if (!fields.length) {
    setError('root', { message: error.message })
    return
  }
  for (const [name, message] of fields) setError(name as Path<T>, { message })
}
