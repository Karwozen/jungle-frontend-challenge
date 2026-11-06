import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AccountSidebar from '@/components/layout/account-sidebar'
import MobilePageHeader from '@/components/layout/mobile-page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { walletsQuery } from '@/domain/wallets/queries'
import { walletFields, type Wallet } from '@/domain/wallets/schema'
import { useSession } from '@/features/auth/use-session'
import WalletSection from './wallet-section'

function Wallets() {
  const { data: session } = useSession()
  const userId = session?.user.id ?? ''
  const { data: wallets, isPending, isError, refetch } = useQuery({ ...walletsQuery(userId), enabled: !!session })
  const [addingPrimary, setAddingPrimary] = useState(false)
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  const primary = wallets?.find((w) => w.role === 'primary')
  const secondary = wallets?.find((w) => w.role === 'secondary')
  // Preenche o formulário da carteira secundária com as configurações da principal, exigindo novo endereço
  const copied = sameAsPrimary && primary ? { ...walletFields.parse(primary), address: '', alias: 'Reserva' } : undefined

  const section = (role: Wallet['role'], wallet: Wallet | undefined, adding: boolean, onAdd: () => void, extra?: React.ReactNode) => {
    const title = role === 'primary' ? 'Carteira principal' : 'Carteira secundária'
    return (
      <section aria-labelledby={`${role}-title`}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id={`${role}-title`} className="font-bold">
              {title}
            </h2>
            {role === 'primary' && (
              <p className="mt-1 text-sm text-muted-foreground">
                Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
              </p>
            )}
          </div>
          {!wallet && (
            <div className="flex items-center gap-4">
              {extra}
              {!adding && (
                <button type="button" onClick={onAdd} className="font-bold text-text-accent hover:underline">
                  Adicionar
                </button>
              )}
            </div>
          )}
        </div>
        {wallet || adding ? (
          <WalletSection
            key={wallet?.id ?? `new-${role}-${sameAsPrimary}`}
            userId={userId}
            role={role}
            wallet={wallet}
            initial={role === 'secondary' ? copied : undefined}
            onSaved={() => setSameAsPrimary(false)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Você ainda não adicionou uma carteira {role === 'primary' ? 'principal' : 'secundária'}.
          </p>
        )}
      </section>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 px-6 py-6 md:py-10 xl:px-0">
      <MobilePageHeader title="Carteiras" toHome />
      <h1 className="sr-only">Carteiras</h1>

      <div className="grid gap-8 md:grid-cols-[17rem_1fr]">
        <AccountSidebar current="wallets" />

        <div className="min-w-0">
          {isPending ? (
            <div aria-busy className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="text-sm">Não foi possível carregar as carteiras.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {section('primary', primary, addingPrimary, () => setAddingPrimary(true))}
              {section(
                'secondary',
                secondary,
                addingSecondary,
                () => setAddingSecondary(true),
                primary && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sameAsPrimary}
                      onChange={(event) => {
                        setSameAsPrimary(event.target.checked)
                        setAddingSecondary(true)
                      }}
                      className="size-4 accent-primary"
                    />
                    Igual à carteira principal
                  </label>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wallets
