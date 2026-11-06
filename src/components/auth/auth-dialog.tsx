import { Fragment } from 'react'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import LoginForm from './login-form'
import SignupForm from './signup-form'

type Mode = 'login' | 'signup'

const tabs: { mode: Mode; label: string }[] = [
  { mode: 'login', label: 'Entrar' },
  { mode: 'signup', label: 'Criar conta' },
]

const descriptions: Record<Mode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  signup: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

// Sincroniza o estado do modal de autenticação com a query string (?auth=login|signup) para preservar o redirecionamento
function AuthDialog() {
  const { auth, redirect, reason } = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const router = useRouter()

  const close = () =>
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, auth: undefined, redirect: undefined, reason: undefined }),
      replace: true,
    })

  const switchTo = (mode: Mode) =>
    navigate({ to: '.', search: (prev) => ({ ...prev, auth: mode }), replace: true })

  const done = () => (redirect ? router.history.push(redirect) : close())

  return (
    <Dialog open={!!auth} onOpenChange={(open) => !open && close()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          if (!window.matchMedia('(min-width: 40rem)').matches) return
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).querySelector('input')?.focus()
        }}
        className="max-h-dvh content-start gap-4 overflow-y-auto bg-card px-5 pb-14 pt-8 sm:rounded-lg sm:px-16 [&_[data-slot=dialog-close]]:text-primary [&_input]:rounded-md [&_input]:border-border [&_input]:placeholder:text-gold sm:max-w-md sm:border-b-[3px] sm:border-b-primary max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:bg-background max-sm:px-6 max-sm:pt-16"
      >
        <DialogTitle className="sr-only">{auth === 'signup' ? 'Criar conta' : 'Entrar'}</DialogTitle>
        {auth && (
          <>
            <div aria-hidden className="grid justify-items-center gap-10 sm:hidden">
              <p className="text-3xl font-bold">KURIO</p>
              <p className="text-lg font-bold">{auth === 'signup' ? 'Criar perfil de colecionador' : 'Entrar'}</p>
            </div>
            <div role="tablist" aria-label="Acesso à conta" className="flex items-center justify-center gap-3 text-base font-bold max-sm:hidden">
              {tabs.map(({ mode, label }, i) => (
                <Fragment key={mode}>
                  {i > 0 && <span aria-hidden className="h-5 w-px bg-border-soft" />}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={auth === mode}
                    onClick={() => switchTo(mode)}
                    className={cn(
                      'rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      auth === mode ? 'text-text-accent' : 'text-foreground',
                    )}
                  >
                    {label}
                  </button>
                </Fragment>
              ))}
            </div>
            <DialogDescription className="text-center text-xs text-foreground max-sm:hidden">
              {descriptions[auth]}
            </DialogDescription>
            {reason === 'expired' && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sua sessão expirou. Entre novamente para continuar.
              </p>
            )}
            <div role="tabpanel">
              {auth === 'login' ? <LoginForm onDone={done} /> : <SignupForm onDone={done} />}
            </div>
            <p className="mt-4 text-center text-sm text-text-secondary sm:hidden">
              {auth === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
              <button
                type="button"
                onClick={() => switchTo(auth === 'login' ? 'signup' : 'login')}
                className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {auth === 'login' ? 'Crie uma conta' : 'Entre'}
              </button>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
