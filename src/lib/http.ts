import axios from 'axios'
import { getToken } from './session-token'

export type ErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAVAILABLE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNKNOWN'
  | (string & {})

export interface ApiErrorBody {
  status: number
  code: ErrorCode
  message: string
  fields?: Record<string, string>
  details?: unknown
}

export class ApiError extends Error {
  status: number
  code: ErrorCode
  fields: Record<string, string>
  details: unknown

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.fields = body.fields ?? {}
    this.details = body.details
  }

  get isTransient() {
    return this.status === 0 || this.status === 408 || this.status >= 500
  }
}

export const http = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (!axios.isAxiosError<Partial<ApiErrorBody>>(error)) {
    return new ApiError({ status: 0, code: 'UNKNOWN', message: 'Algo deu errado.' })
  }
  if (axios.isCancel(error)) {
    return new ApiError({ status: 0, code: 'UNKNOWN', message: 'Requisição cancelada.' })
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({
      status: 0,
      code: 'TIMEOUT',
      message: 'A requisição demorou demais. Tente novamente.',
    })
  }
  if (!error.response) {
    return new ApiError({ status: 0, code: 'NETWORK', message: 'Sem conexão com o servidor.' })
  }

  const { status, data } = error.response
  return new ApiError({
    status,
    code: data?.code ?? 'UNKNOWN',
    message: data?.message ?? 'Algo deu errado.',
    fields: data?.fields,
    details: data?.details,
  })
}

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)
