import { Link } from '@tanstack/react-router'
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react'
import { useState } from 'react'
import { AuxiliaryAction } from '../components/AuxiliaryAction'
const home = { q: '', collection: '', page: 1, sort: 'recent' as const }
const features = [
  ['W', 'Segurança da carteira', 'Proteja sua carteira e colecione arte digital verificada com confiança.'],
  ['C', 'Criadores em destaque', 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.'],
  ['D', 'Alertas de lançamentos', 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.'],
]
export function StorefrontFooter() {
  const [newsletterNotice, setNewsletterNotice] = useState(false)
  return <footer id="about-kurio" className="market-container storefront-footer">
    <div className="footer-features">{features.map(([letter, title, text]) => <article key={letter}><span className="feature-medallion" aria-hidden="true">{letter}</span><h2>{title}</h2><p>{text}</p></article>)}
      <section className="footer-newsletter"><h2>Antecipe-se ao próximo lançamento</h2><form onSubmit={event => { event.preventDefault(); setNewsletterNotice(true) }}><label htmlFor="newsletter-email" className="sr-only">E-mail para novidades</label><input id="newsletter-email" type="email" placeholder="digite seu e-mail..." required/><button type="submit">Enviar</button></form><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>{newsletterNotice && <p role="status">Newsletter ilustrativa. Seu e-mail não foi enviado nem cadastrado.</p>}</section>
    </div>
    <div className="footer-brand"><Link to="/" search={home} className="wordmark">KURIO</Link><p>Feito para colecionadores,<br/>criadores e cultura</p><span>contato@email.com</span><span>+55 11 4002 8922</span></div>
    <div className="footer-directory">
      <nav aria-label="Meu perfil"><h2>Meu perfil</h2><Link to="/account/profile">Meu perfil</Link><AuxiliaryAction>Minha coleção</AuxiliaryAction><AuxiliaryAction>Atividade</AuxiliaryAction><AuxiliaryAction>Estúdio do criador</AuxiliaryAction><Link to="/account/favorites">Lista de interesse</Link></nav>
      <nav aria-label="Central de ajuda"><h2>Central de ajuda</h2>{['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'].map(label => <AuxiliaryAction key={label}>{label}</AuxiliaryAction>)}</nav>
      <nav aria-label="Coleções"><h2>Coleções</h2>{['Arte 3D', 'Arte digital', 'Fotografia', 'Música', 'Utilidade'].map(category => <Link key={category} to="/" search={{ ...home, category }} hash="market">{category}</Link>)}</nav>
      <div><h2>Redes sociais</h2><div className="footer-socials">{[[Facebook, 'Facebook'], [Instagram, 'Instagram'], [Twitter, 'Twitter'], [Linkedin, 'LinkedIn'], [Youtube, 'YouTube']].map(([Icon, name]) => { const SocialIcon = Icon as typeof Facebook; return <AuxiliaryAction key={String(name)} title={String(name)} className="footer-social"><SocialIcon size={19}/><span className="sr-only">{String(name)}</span></AuxiliaryAction> })}</div><h2 className="footer-wallet-title">Carteiras compatíveis</h2><Link className="wallet-chips" to="/account/wallets">METAMASK <span>·</span> WALLETCONNECT <span>·</span> COINBASE</Link></div>
    </div>
    <div className="footer-bottom">© 2026 Kurio. Propriedade digital para todos.</div>
  </footer>
}
