import { Link } from '@tanstack/react-router'
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import type { ReactNode } from 'react'
import { outOfScope } from '@/lib/out-of-scope'

const socials = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
]

function OutOfScopeLink({ children }: { children: ReactNode }) {
  return (
    <li>
      <button type="button" onClick={outOfScope} className="rounded-sm text-left text-sm text-foreground outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50">
        {children}
      </button>
    </li>
  )
}

function FooterColumns() {
  return (
    <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 justify-items-center gap-6 bg-card py-8">
      <nav aria-labelledby="footer-profile" className="grid content-start gap-3">
        <h2 id="footer-profile" className="font-bold">
          Meu perfil
        </h2>
        <ul className="grid gap-2">
          <li>
            <Link to="/profile" className="rounded-sm text-left text-sm text-foreground outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50">
              Meu perfil
            </Link>
          </li>
          <OutOfScopeLink>Minha coleção</OutOfScopeLink>
          <OutOfScopeLink>Atividade</OutOfScopeLink>
          <OutOfScopeLink>Estúdio do criador</OutOfScopeLink>
          <OutOfScopeLink>Lista de interesse</OutOfScopeLink>
        </ul>
      </nav>

      <nav aria-labelledby="footer-help" className="grid content-start gap-3">
        <h2 id="footer-help" className="font-bold">
          Central de ajuda
        </h2>
        <ul className="grid gap-2">
          <OutOfScopeLink>Central de ajuda</OutOfScopeLink>
          <OutOfScopeLink>Como comprar NFTs</OutOfScopeLink>
          <OutOfScopeLink>Carteira e segurança</OutOfScopeLink>
          <OutOfScopeLink>Política do mercado</OutOfScopeLink>
          <OutOfScopeLink>Denunciar item</OutOfScopeLink>
        </ul>
      </nav>

      <nav aria-labelledby="footer-collections" className="grid content-start gap-3">
        <h2 id="footer-collections" className="font-bold">
          Coleções
        </h2>
        <ul className="grid gap-2">
          <OutOfScopeLink>Arte 3D</OutOfScopeLink>
          <OutOfScopeLink>Arte digital</OutOfScopeLink>
          <OutOfScopeLink>Fotografia</OutOfScopeLink>
          <OutOfScopeLink>Música</OutOfScopeLink>
          <OutOfScopeLink>Utilidade</OutOfScopeLink>
        </ul>
      </nav>

      <div className="grid content-start gap-3">
        <h2 className="font-bold">Redes sociais</h2>
        <div className="flex gap-2">
          {socials.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-primary text-primary outline-none hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Icon className="size-4" aria-hidden />
            </a>
          ))}
        </div>

        <h2 className="mt-4 font-bold">Carteiras compatíveis</h2>
        <p className="flex w-fit items-center gap-2 rounded-md border border-primary px-4 py-2 text-tiny font-bold tracking-wide text-text-accent">
          METAMASK <span aria-hidden>•</span> WALLETCONNECT <span aria-hidden>•</span> COINBASE
        </p>
      </div>
    </div>
  )
}

export default FooterColumns
