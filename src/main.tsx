import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { endSession } from '@/features/auth/session'
import { initMotion } from '@/lib/motion'
import { queryClient, setSessionLostHandler } from '@/lib/query-client'
import { withoutAuthParams } from '@/lib/redirect'
import { routeTree } from './routeTree.gen'

const MockPanel = lazy(() => import('@/mocks/panel'))
const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Ao detectar expiração de sessão na API, limpa os dados privados e abre o modal de login preservando a rota atual
setSessionLostHandler(() => {
  endSession()
  const here = withoutAuthParams(router.state.location.href)
  router.navigate({
    to: '.',
    search: (prev) => ({ ...prev, auth: 'login', redirect: here, reason: 'expired' }),
    replace: true,
  })
})

initMotion()

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { startMocks } = await import('@/mocks/browser')
  await startMocks()
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {mocksEnabled && (
          <Suspense fallback={null}>
            <MockPanel />
          </Suspense>
        )}
      </QueryClientProvider>
    </StrictMode>,
  )
})
