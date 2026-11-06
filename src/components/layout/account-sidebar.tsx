import { Link } from '@tanstack/react-router'
import { Download, Heart, LifeBuoy, LogOut, MapPin, ShoppingCart, Tag, User, type LucideIcon } from 'lucide-react'
import { useLogout } from '@/features/auth/mutations'
import { outOfScope } from '@/lib/out-of-scope'
import { cn } from '@/lib/utils'

const itemClass =
  'flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-left text-sm outline-none focus-visible:bg-secondary/40'

const soon: { label: string; icon: LucideIcon }[] = [
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Ofertas', icon: Tag },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: LifeBuoy },
]

function AccountSidebar({ current }: { current: 'profile' | 'wallets' | 'favorites' }) {
  const logout = useLogout()

  const link = (id: typeof current, to: '/profile' | '/wallets' | '/favorites', label: string, Icon: LucideIcon) => (
    <Link
      to={to}
      aria-current={current === id ? 'page' : undefined}
      className={cn(
        itemClass,
        current === id ? 'border-primary bg-secondary/40 font-bold text-text-accent' : 'text-text-secondary',
      )}
    >
      <Icon aria-hidden className="size-4" /> {label}
    </Link>
  )

  const chip =
    'shrink-0 rounded-full border px-4 py-2 text-xs whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

  return (
    <>
      <nav aria-label="Minha conta" className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:hidden">
        {(
          [
            ['profile', '/profile', 'Dados do perfil'],
            ['wallets', '/wallets', 'Carteiras'],
            ['favorites', '/favorites', 'Lista de interesse'],
          ] as const
        ).map(([id, to, label]) => (
          <Link
            key={id}
            to={to}
            aria-current={current === id ? 'page' : undefined}
            className={cn(
              chip,
              current === id ? 'border-primary font-bold text-text-accent' : 'border-border-soft text-text-secondary',
            )}
          >
            {label}
          </Link>
        ))}
        {soon.map(({ label }) => (
          <button
            key={label}
            type="button"
            onClick={outOfScope}
            className={cn(chip, 'border-border text-muted-foreground')}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => logout.mutate()} className={cn(chip, 'border-border-soft font-bold')}>
          Sair
        </button>
      </nav>

      <nav aria-label="Minha conta" className="hidden rounded-lg bg-card py-4 md:block">
        <h2 className="px-4 pb-3 text-lg font-bold">Meu perfil</h2>
        {link('profile', '/profile', 'Dados do perfil', User)}
        {link('wallets', '/wallets', 'Carteiras', MapPin)}
        {link('favorites', '/favorites', 'Lista de interesse', Heart)}
        {soon.map(({ label, icon: Icon }) => (
          <button key={label} type="button" onClick={outOfScope} className={cn(itemClass, 'text-muted-foreground')}>
            <Icon aria-hidden className="size-4" />
            <span className="flex-1">{label}</span>
            <span className="text-tiny uppercase">Em breve</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => logout.mutate()}
          className={cn(itemClass, 'mt-2 border-t border-border-soft font-bold')}
        >
          <LogOut aria-hidden className="size-4" /> Sair
        </button>
      </nav>
    </>
  )
}

export default AccountSidebar
