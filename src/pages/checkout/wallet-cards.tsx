import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Plug, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Network } from '@/domain/catalog/schema'
import { connectWallet, disconnectWallet } from '@/domain/wallets/api'
import { walletsKey } from '@/domain/wallets/queries'
import type { Wallet } from '@/domain/wallets/schema'
import { networkLabels } from '@/features/catalog/labels'
import { cn } from '@/lib/utils'

interface WalletCardsProps {
  userId: string
  wallets: Wallet[]
  selected: Wallet
  network: Network
  onSelect: (id: string) => void
}

const shorten = (address: string) => (address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address)

function WalletCards({ userId, wallets, selected, network, onSelect }: WalletCardsProps) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: walletsKey(userId) })
  const connected = selected.connection?.network === network

  const connect = useMutation({
    mutationFn: () => connectWallet(selected.id, network),
    onSuccess: () => {
      refresh()
      toast.success('Carteira conectada')
    },
    onError: (error) => toast.error(error.message),
  })
  const disconnect = useMutation({
    mutationFn: () => disconnectWallet(selected.id),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">Carteira conectada</h2>
        <Link to="/wallets" className="text-xs text-text-accent">
          Trocar carteira
        </Link>
      </div>

      <div role="radiogroup" aria-label="Carteira" className="grid gap-3">
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            type="button"
            role="radio"
            aria-checked={wallet.id === selected.id}
            onClick={() => onSelect(wallet.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              wallet.id === selected.id && 'border-primary',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-3 shrink-0 rounded-full border-2 border-primary',
                wallet.id === selected.id && 'bg-primary',
              )}
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold">{wallet.alias}</span>
              <span className="block truncate text-text-secondary">{wallet.ensName || shorten(wallet.address)}</span>
              <span className="block text-text-secondary">
                {wallet.role === 'primary' ? 'Rede principal' : 'Rede'} {networkLabels[wallet.network]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <p role="status" className={connected ? 'text-text-accent' : 'text-muted-foreground'}>
          {connected ? `Conectada em ${networkLabels[network]}` : `Desconectada de ${networkLabels[network]}`}
        </p>
        {connected ? (
          <Button type="button" variant="outline" size="sm" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
            <Unplug aria-hidden /> Desconectar
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={connect.isPending} onClick={() => connect.mutate()}>
            <Plug aria-hidden /> {connect.isPending ? 'Conectando…' : `Conectar na ${networkLabels[network]}`}
          </Button>
        )}
      </div>
    </div>
  )
}

export default WalletCards
