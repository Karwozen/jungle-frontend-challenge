import { createRootRoute, Outlet } from '@tanstack/react-router'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import LiveRegion from '@/components/layout/live-region'
import MobileTabBar from '@/components/layout/mobile-tab-bar'
import NotFound from '@/components/layout/not-found'
import RouteError from '@/components/layout/route-error'
import { Toaster } from '@/components/ui/sonner'
import AuthDialog from '@/components/auth/auth-dialog'
import RealtimeSync from '@/features/realtime/realtime-sync'
import { isLocalPath } from '@/lib/redirect'

interface RootSearch {
  auth?: 'login' | 'signup'
  redirect?: string
  reason?: 'expired'
}

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>): RootSearch => ({
    auth: search.auth === 'login' || search.auth === 'signup' ? search.auth : undefined,
    redirect:
      typeof search.redirect === 'string' && isLocalPath(search.redirect) ? search.redirect : undefined,
    reason: search.reason === 'expired' ? 'expired' : undefined,
  }),
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Ir para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="flex-1 pb-28 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <AuthDialog />
      <Toaster position="top-center" />
      <LiveRegion />
      <RealtimeSync />
    </div>
  )
}
