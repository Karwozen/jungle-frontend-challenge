// Wrapper seguro para localStorage que evita exceções em ambientes com armazenamento restrito
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // storage bloqueado
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      // storage bloqueado
    }
  },
}
