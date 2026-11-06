import { storage } from '@/lib/storage'

const KEY = 'kurio.token'

export const getToken = () => storage.get(KEY)
export const setToken = (token: string) => storage.set(KEY, token)
export const clearToken = () => storage.remove(KEY)
