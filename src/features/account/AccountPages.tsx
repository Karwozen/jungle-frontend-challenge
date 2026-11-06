import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../shared/api'
import { loginSchema, registerSchema, safeReturnTo, type AuthResponse, type User } from '../../shared/account'
import { acceptSession, sessionQuery } from './session'
import { Button } from '../../components/ui/button'
import { AccountSidebar } from './AccountSidebar'
import { ProfileEditor } from './ProfileEditor'
import { PasswordInput } from '../../components/PasswordInput'
import { ProviderIcon } from '../../components/ProviderIcon'
import { Catalog } from '../catalog/Catalog'
export function LoginPage() { return <AuthPage/> }
export function RegisterPage() { return <AuthPage register/> }
export function AuthPage({ register = false }: { register?: boolean }) {
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [provider, setProvider] = useState<'Google' | 'Facebook' | null>(null)
  const [recovery, setRecovery] = useState(false)
  const returnTo = safeReturnTo(search.returnTo)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    element.querySelector<HTMLInputElement>('input')?.focus()
    return () => element.close()
  }, [])
  const accept = async (result: AuthResponse) => { await acceptSession(result); await navigate({ href: returnTo }) }
  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => (await api.post<AuthResponse>(register ? '/register' : '/login', data)).data,
    onSuccess: accept,
    onError: error => { if (axios.isAxiosError(error)) setErrors(error.response?.data.fields ?? {}) },
  })
  const social = useMutation({ mutationFn: async (selected: 'Google' | 'Facebook') => (await api.post<AuthResponse>('/auth/social', { provider: selected.toLowerCase() })).data, onSuccess: accept })
  const home = { q: '', collection: '', sort: 'recent' as const, page: 1 }
  const fields = register ? ['name', 'email', 'password', 'confirmPassword'] : ['email', 'password']
  const labels: Record<string, string> = { name: 'Nome', email: 'E-mail', password: 'Senha', confirmPassword: 'Confirmar senha' }
  const placeholders: Record<string, string> = { name: 'Nome de usuário', email: register ? 'Digite seu e-mail' : 'contato@email.com', password: 'Senha', confirmPassword: 'Confirmar senha' }
  return <><div className="auth-background"><Catalog/></div><dialog ref={dialog} className={`auth-dialog${register ? ' auth-register' : ''}`} aria-labelledby="auth-title" onCancel={() => void navigate({ to: '/', search: home })} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], input:not(:disabled), button:not(:disabled), select:not(:disabled)')].filter(element => element.getClientRects().length)
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }}><section>
    <Link to="/" search={home} className="dialog-close" aria-label="Fechar formulário">×</Link>
    <Link to="/" search={home} className="auth-mobile-logo" aria-label="KURIO — Início">KURIO</Link>
    <nav aria-label="Autenticação" className="auth-tabs"><Link to="/login" search={{ returnTo }} aria-current={!register ? 'page' : undefined}>Entrar</Link><Link to="/register" search={{ returnTo }} aria-current={register ? 'page' : undefined}>Criar conta</Link></nav>
    <h1 id="auth-title" className="auth-mobile-heading">{register ? 'Criar perfil de colecionador' : 'Entrar'}</h1>
    <p className="auth-subtitle">{register ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.' : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</p>
    <form noValidate onSubmit={event => {
      event.preventDefault(); mutation.reset(); const data = Object.fromEntries(new FormData(event.currentTarget))
      const parsed = (register ? registerSchema : loginSchema).safeParse(data)
      const nextErrors = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message]))
      if (register && data.password !== data.confirmPassword) nextErrors.confirmPassword = 'As senhas não coincidem.'
      if (!parsed.success || Object.keys(nextErrors).length) { setErrors(nextErrors); return }
      setErrors({}); mutation.mutate(parsed.data)
    }}>
      {fields.map(name => { const props = { id: name, name, placeholder: placeholders[name], autoComplete: name.includes('assword') ? register ? 'new-password' : 'current-password' : name === 'name' ? 'name' : 'email', 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined }; return <div className="form-field" key={name}><label className="sr-only" htmlFor={name}>{labels[name]}</label>{name.includes('assword') ? <PasswordInput {...props}/> : <input {...props} type={name === 'email' ? 'email' : 'text'}/ >}{errors[name] && <p id={`${name}-error`} className="field-error">{errors[name]}</p>}</div> })}
      {!register && <button className="forgot-password" type="button" onClick={() => setRecovery(value => !value)}>Esqueceu a senha?</button>}
      {recovery && <p role="status" className="auth-help">Nesta demonstração, use alice@kurio.test e a senha Kurio2026!. A recuperação por e-mail não está disponível.</p>}
      {mutation.isError && <p role="alert" className="field-error">{axios.isAxiosError(mutation.error) ? mutation.error.response?.data.message ?? 'Não foi possível conectar. Tente novamente.' : 'Tente novamente.'}</p>}
      <Button type="submit" className="auth-submit" disabled={mutation.isPending || social.isPending}>{mutation.isPending ? 'Aguarde…' : register ? <><span className="auth-desktop-label">Criar conta</span><span className="auth-mobile-label">Criar perfil</span></> : 'Entrar'}</Button>
    </form>
    <div className="auth-divider"><span>Ou continue com</span></div>
    <div className="social-auth">{(['Google', 'Facebook'] as const).map(name => <button key={name} type="button" disabled={social.isPending || mutation.isPending} onClick={() => { setProvider(name); social.reset() }}><ProviderIcon provider={name}/>Continuar com {name}</button>)}</div>
    {provider && <section className="social-confirmation" aria-label={`Demonstração ${provider}`}><p>Login simulado com {provider}. Será usado um perfil fictício, sem acessar sua conta real.</p><Button disabled={social.isPending} onClick={() => social.mutate(provider)}>{social.isPending ? 'Entrando…' : 'Continuar na demonstração'}</Button><button type="button" disabled={social.isPending} onClick={() => { setProvider(null); social.reset() }}>Cancelar</button>{social.isError && <p role="alert" className="field-error">Não foi possível entrar. Tente novamente.</p>}</section>}
    <p className="auth-switch">{register ? 'Já tem uma conta?' : 'Novo na Kurio?'} <Link to={register ? '/login' : '/register'} search={{ returnTo }}>{register ? 'Entre' : 'Crie uma conta'}</Link></p>
  </section></dialog></>
}
export function WalletsPage() { return <ProfilePage walletsOnly/> }
export function ProfilePage({ walletsOnly = false }: { walletsOnly?: boolean }) {
  const session = useQuery(sessionQuery)
  const profile = useQuery({ queryKey: ['private', session.data?.user?.id, 'profile'], queryFn: async ({ signal }) => (await api.get<User>('/profile', { signal })).data, enabled: Boolean(session.data?.user), retry: false })
  return <main id="content" className="market-container account-layout"><AccountSidebar/><section className="account-content"><h1>{walletsOnly ? 'Carteira principal' : 'Perfil do colecionador'}</h1>{profile.isPending ? <div className="skeleton h-28"/> : profile.isError ? <p role="alert">Não foi possível carregar seu perfil.</p> : <ProfileEditor user={profile.data} walletsOnly={walletsOnly}/>}</section></main>
}
