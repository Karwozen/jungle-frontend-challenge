import { useQuery } from '@tanstack/react-query'
import { sessionQuery } from '@/domain/auth/queries'

export const useSession = () => useQuery(sessionQuery)
