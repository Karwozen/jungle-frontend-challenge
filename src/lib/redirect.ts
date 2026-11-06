export const isLocalPath = (value: string) => value.startsWith('/') && !value.startsWith('//')

// o destino guardado não pode carregar os parâmetros do próprio login, senão reabriria o diálogo
export function withoutAuthParams(href: string) {
  const url = new URL(href, 'http://local')
  url.searchParams.delete('auth')
  url.searchParams.delete('redirect')
  url.searchParams.delete('reason')
  return url.pathname + url.search + url.hash
}
