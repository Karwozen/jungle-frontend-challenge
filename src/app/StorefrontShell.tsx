import { Link, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { Heart, House, LogIn, Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, SESSION_TOKEN_KEY } from '../shared/api'
import { clearPrivateData, sessionQuery } from '../features/account/session'
import { StorefrontFooter } from './StorefrontFooter'
import { AuxiliaryAction } from '../components/AuxiliaryAction'
const homeSearch = { q: '', collection: '', page: 1, sort: 'recent' as const }

export function StorefrontShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const session = useQuery(sessionQuery)
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isMarket = location.hash === 'market' || /^\/(nfts|cart|checkout)(\/|$)/.test(location.pathname)
  useEffect(() => {
    const expired = () => { void clearPrivateData().then(() => { if (location.pathname.startsWith('/account') || location.pathname.startsWith('/checkout')) void navigate({ to: '/login', search: { returnTo: location.href } }) }) }
    window.addEventListener('kurio:session-expired', expired)
    return () => window.removeEventListener('kurio:session-expired', expired)
  }, [location.href, location.pathname, navigate])
  const logout = useMutation({ mutationFn: () => api.post('/logout'), onSuccess: async () => { localStorage.removeItem(SESSION_TOKEN_KEY); await clearPrivateData(); await navigate({ to: '/', search: homeSearch }) } })
  return <>
    <a href="#content" className="skip-link">Pular para o conteúdo</a>
    {!location.pathname.startsWith('/checkout/orders/') && <header className={`storefront-header${isHome ? ' is-home' : ''}${location.pathname === '/login' || location.pathname === '/register' ? ' is-auth' : ''}${location.pathname === '/cart' ? ' is-cart' : ''}${location.pathname.startsWith('/nfts/') ? ' is-nft-detail' : ''}${location.pathname === '/checkout' ? ' is-checkout' : ''}`}><div className="header-content">
      <Link to="/" search={homeSearch} className="wordmark" aria-label="KURIO — Início">KURIO</Link>
      <nav aria-label="Principal" className="desktop-nav"><Link to="/" search={homeSearch} className={isHome && !isMarket ? 'nav-selected' : undefined}>Início</Link><Link to="/" search={homeSearch} hash="market" className={isMarket ? 'nav-selected' : undefined}>Mercado</Link><AuxiliaryAction>Criadores</AuxiliaryAction><AuxiliaryAction>Aprenda</AuxiliaryAction></nav>
      <div className="header-right"><Link to="/" search={homeSearch} hash="market-search" className="header-search" aria-label="Buscar no catálogo"><Search size={18} aria-hidden="true"/></Link>
      <Link to="/cart" className="account-link header-cart" aria-label="Carrinho"><ShoppingCart size={18} aria-hidden="true"/></Link>{session.data?.user ? <><Link to="/account/profile" className="account-link">Meu perfil</Link>{!location.pathname.startsWith('/account/') && <button className="account-link" disabled={logout.isPending} onClick={() => logout.mutate()}>Sair</button>}</> : <Link to="/login" search={{ returnTo: location.href }} className="account-link header-login"><LogIn size={15} aria-hidden="true"/>Entrar</Link>}<button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button></div>
    </div>{menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navegação mobile"><Link to="/" search={homeSearch} onClick={() => setMenuOpen(false)}>Início</Link><Link to="/" search={homeSearch} hash="market" onClick={() => setMenuOpen(false)}>Mercado</Link><AuxiliaryAction>Criadores</AuxiliaryAction><AuxiliaryAction>Aprenda</AuxiliaryAction></nav>}</header>}
    {logout.isError && <p role="alert" className="market-container field-error">Não foi possível sair. Tente novamente.</p>}<Outlet/>
    {isHome && <nav className="market-mobile-nav" aria-label="Navegação do marketplace">
      <Link to="/" search={homeSearch} aria-label="Início" aria-current="page"><House aria-hidden="true"/></Link>
      <Link to="/account/favorites" aria-label="Favoritos"><Heart aria-hidden="true"/></Link>
      <a className="mobile-search-shortcut" href="#market-search" aria-label="Buscar no catálogo"
        onClick={() => document.querySelector<HTMLInputElement>('#market-search input')?.focus()}><Search aria-hidden="true"/></a>
      <Link to="/cart" aria-label="Carrinho"><ShoppingCart aria-hidden="true"/></Link>
      {session.data?.user
        ? <Link to="/account/profile" aria-label="Meu perfil"><UserRound aria-hidden="true"/></Link>
        : <Link to="/login" search={{ returnTo: location.href }} aria-label="Entrar"><UserRound aria-hidden="true"/></Link>}
    </nav>}
    {!location.pathname.startsWith('/account/') && !location.pathname.startsWith('/checkout/orders/') && <StorefrontFooter/>}
    {import.meta.env.VITE_ENABLE_MOCKS !== 'false' && <Link to="/demo/scenarios" className="demo-launcher" aria-label="Cenários da demonstração">◇</Link>}
  </>
}
