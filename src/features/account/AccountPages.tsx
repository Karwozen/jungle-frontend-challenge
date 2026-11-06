import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../shared/api'
import { loginSchema, registerSchema, safeReturnTo, type AuthResponse, type User } from '../../shared/account'
import { acceptSession, sessionQuery } from './session'
import { Button } from '../../components/ui/button'
import { ProfileEditor } from './ProfileEditor'
import { Catalog } from '../catalog/Catalog'
export function LoginPage() { return <AuthPage/> }
export function RegisterPage() { return <AuthPage register/> }
export function AuthPage({ register = false }: { register?: boolean }) {
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    element.querySelector<HTMLInputElement>('input')?.focus()
    return () => element.close()
  }, [])
  const [errors, setErrors] = useState<Record<string,string>>({})
  const mutation = useMutation({ mutationFn: async (data: Record<string, string>) => (await api.post<AuthResponse>(register ? '/register' : '/login', data)).data,
    onSuccess: async result => { await acceptSession(result); await navigate({ href: safeReturnTo(search.returnTo) }) },
    onError: error => { if (axios.isAxiosError(error)) setErrors(error.response?.data.fields ?? {}) },
  })
  return <><Catalog/><dialog ref={dialog} className="auth-dialog" aria-labelledby="auth-title" onKeyDown={event => {
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], input:not(:disabled), button:not(:disabled), select:not(:disabled)')]
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }} onCancel={() => void navigate({ to: '/', search: { q: '', collection: '', sort: 'recent', page: 1 } })}><section><Link to="/" search={{ q: '', collection: '', sort: 'recent', page: 1 }} className="dialog-close" aria-label="Fechar formulário">×</Link><nav aria-label="Autenticação" className="auth-tabs"><Link to="/login" search={{ returnTo: safeReturnTo(search.returnTo) }}>Entrar</Link><Link to="/register" search={{ returnTo: safeReturnTo(search.returnTo) }}>Criar conta</Link></nav><h1 id="auth-title">{register ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1><p className="auth-subtitle">{register ? 'Um lugar para descobrir e colecionar arte.' : 'Entre para continuar sua coleção.'}</p><form noValidate onSubmit={event => {
    event.preventDefault(); mutation.reset(); const data = Object.fromEntries(new FormData(event.currentTarget))
    const parsed = (register ? registerSchema : loginSchema).safeParse(data)
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message]))); return }
    setErrors({}); mutation.mutate(parsed.data)
  }}>{(register ? ['name','email','password'] : ['email','password']).map(name => <div className="form-field" key={name}><label htmlFor={name}>{name === 'name' ? 'Nome' : name === 'email' ? 'E-mail' : 'Senha'}</label><input id={name} name={name} type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} autoComplete={name === 'password' ? register ? 'new-password' : 'current-password' : name === 'name' ? 'name' : 'email'} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{errors[name] && <p id={`${name}-error`} className="field-error">{errors[name]}</p>}</div>)}
  {mutation.isError && <p role="alert" className="field-error">{axios.isAxiosError(mutation.error) ? mutation.error.response?.data.message ?? 'Não foi possível conectar. Tente novamente.' : 'Tente novamente.'}</p>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</Button></form><p className="auth-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem conta?'} <Link to={register ? '/login' : '/register'} search={{ returnTo: safeReturnTo(search.returnTo) }}>{register ? 'Entrar' : 'Criar conta'}</Link></p></section></dialog></>
}
export function WalletsPage() { return <ProfilePage walletsOnly/> }
export function ProfilePage({ walletsOnly = false }: { walletsOnly?: boolean }) {
  const session = useQuery(sessionQuery)
  const profile = useQuery({ queryKey: ['private', session.data?.user?.id, 'profile'], queryFn: async ({ signal }) => (await api.get<User>('/profile', { signal })).data, enabled: Boolean(session.data?.user), retry: false })
  return <main id="content" className="market-container account-layout"><aside className="account-sidebar"><h2>Meu perfil</h2><nav aria-label="Conta do colecionador"><Link to="/account/profile" activeProps={{ 'aria-current': 'page' }}>Perfil do colecionador</Link><Link to="/account/wallets" activeProps={{ 'aria-current': 'page' }}>Carteiras</Link><Link to="/account/favorites">Favoritos</Link></nav></aside><section className="account-content"><h1>{walletsOnly ? 'Carteiras' : 'Perfil do colecionador'}</h1>{profile.isPending ? <div className="skeleton h-28"/> : profile.isError ? <p role="alert">Não foi possível carregar seu perfil.</p> : <ProfileEditor user={profile.data} walletsOnly={walletsOnly}/>}</section></main>
}
