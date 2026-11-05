import { Link, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { ArrowUpRight, Menu, X, ShieldCheck, Palette, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, SESSION_TOKEN_KEY } from '../shared/api'
import { clearPrivateData, sessionQuery } from '../features/account/session'
const homeSearch = { q: '', collection: '', page: 1, sort: 'recent' as const }

export function StorefrontShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const session = useQuery(sessionQuery)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const expired = () => { void clearPrivateData().then(() => { if (location.pathname.startsWith('/account') || location.pathname.startsWith('/checkout')) void navigate({ to: '/login', search: { returnTo: location.href } }) }) }
    window.addEventListener('kurio:session-expired', expired)
    return () => window.removeEventListener('kurio:session-expired', expired)
  }, [location.href, location.pathname, navigate])
  const logout = useMutation({ mutationFn: () => api.post('/logout'), onSuccess: async () => { localStorage.removeItem(SESSION_TOKEN_KEY); await clearPrivateData(); await navigate({ to: '/', search: homeSearch }) } })
  return <>
    <a href="#content" className="skip-link">Pular para o conteúdo</a>
    <header className={`storefront-header${location.pathname.startsWith('/nfts/') ? ' is-nft-detail' : ''}`}><div className="header-content">
      <Link to="/" search={homeSearch} className="wordmark" aria-label="KURIO — Início">KURIO</Link>
      <nav aria-label="Principal" className="desktop-nav"><Link to="/" search={homeSearch} activeOptions={{ exact: true }} activeProps={{ className: 'active' }}>Início</Link><Link to="/" search={homeSearch} hash="market">Mercado</Link><span aria-disabled="true">Criadores</span><span aria-disabled="true">Aprenda</span></nav>
      <div className="header-right"><Link to="/cart" className="account-link">Carrinho</Link>{session.data?.user ? <><Link to="/account/profile" className="account-link">Meu perfil</Link><button className="account-link" disabled={logout.isPending} onClick={() => logout.mutate()}>Sair</button></> : <Link to="/login" search={{ returnTo: location.href }} className="account-link">Entrar</Link>}<button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button></div>
    </div>{menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navegação mobile"><Link to="/" search={homeSearch} onClick={() => setMenuOpen(false)}>Início</Link><Link to="/" search={homeSearch} hash="market" onClick={() => setMenuOpen(false)}>Mercado</Link><span aria-disabled="true">Criadores</span><span aria-disabled="true">Aprenda</span></nav>}</header>
    {logout.isError && <p role="alert" className="market-container field-error">Não foi possível sair. Tente novamente.</p>}<Outlet/>
    <footer id="about-kurio" className="market-container storefront-footer">
      <div className="footer-features"><article><ShieldCheck size={23} aria-hidden="true"/><h2>Segurança da carteira</h2><p>Proteja sua carteira e confirme os detalhes antes de colecionar.</p></article><article><Palette size={23} aria-hidden="true"/><h2>Criadores em destaque</h2><p>Explore as obras e coleções disponíveis no mercado.</p></article><article><Sparkles size={23} aria-hidden="true"/><h2>Alertas de lançamentos</h2><Link to="/" search={homeSearch} hash="market">Explorar <ArrowUpRight size={15} aria-hidden="true"/></Link></article></div>
      <div className="footer-brand"><Link to="/" search={homeSearch} className="wordmark">KURIO</Link><p>Feito para colecionadores,<br/>criadores e cultura.</p><p className="footer-disclaimer">Marketplace de demonstração.<br/>Compras e carteiras simuladas.</p></div><div className="footer-bottom"><span>© 2026 Kurio. Propriedade digital para todos.</span><Link to="/" search={homeSearch} hash="market">Explorar mercado <ArrowUpRight size={13}/></Link></div>
      <div className="footer-directory"><div><h2>Meu perfil</h2><Link to="/account/profile">Meu perfil</Link><Link to="/account/wallets">Carteiras</Link></div><div><h2>Central de ajuda</h2><p>Como comprar NFTs</p><p>Carteira e segurança</p>{import.meta.env.VITE_ENABLE_MOCKS !== 'false' && <Link to="/demo/scenarios">Cenários da demonstração</Link>}</div><div><h2>Coleções</h2><Link to="/" search={homeSearch} hash="market">Arte digital</Link><p>Fotografia</p><p>Música</p></div><div><h2>Redes sociais</h2><p>Acompanhe a KURIO</p><h2>Redes compatíveis</h2><p>Ethereum · Polygon · Solana</p></div></div>
    </footer>
  </>
}
