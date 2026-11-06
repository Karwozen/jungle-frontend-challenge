import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { login, logout, signup, socialLogin } from '@/domain/auth/api'
import { endSession, startSession } from './session'

export const useLogin = () => useMutation({ mutationFn: login, onSuccess: startSession })

export const useSignup = () => useMutation({ mutationFn: signup, onSuccess: startSession })

export const useSocialLogin = () => useMutation({ mutationFn: socialLogin, onSuccess: startSession })

const privateRoutes = /^\/(profile|wallets|favorites|checkout|orders)(\/|$)/

export function useLogout() {
  const router = useRouter()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => {
      if (privateRoutes.test(router.state.location.pathname)) navigate({ to: '/', replace: true })
      endSession()
    },
  })
}
