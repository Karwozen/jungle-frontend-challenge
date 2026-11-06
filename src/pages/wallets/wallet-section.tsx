import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import WalletFields from '@/components/wallet/wallet-fields'
import { Button } from '@/components/ui/button'
import { createWallet, updateWallet } from '@/domain/wallets/api'
import { walletsKey } from '@/domain/wallets/queries'
import { walletFields, walletInput, type Wallet, type WalletInput } from '@/domain/wallets/schema'
import { applyApiError } from '@/lib/form-errors'

const empty = {
  displayName: '',
  alias: '',
  network: '',
  profileName: '',
  address: '',
  secondaryAddress: '',
  provider: '',
  referralCode: '',
  email: '',
  ensName: '',
  ensSuffix: 'eth',
} as unknown as WalletInput

interface WalletSectionProps {
  userId: string
  role: Wallet['role']
  wallet?: Wallet
  initial?: WalletInput
  onSaved?: () => void
}

function WalletSection({ userId, role, wallet, initial, onSaved }: WalletSectionProps) {
  const queryClient = useQueryClient()
  const form = useForm<WalletInput>({
    resolver: zodResolver(walletInput),
    defaultValues: wallet ? walletFields.parse(wallet) : (initial ?? empty),
  })

  const save = useMutation({
    mutationFn: (values: WalletInput) => (wallet ? updateWallet(wallet.id, values) : createWallet({ ...values, role })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletsKey(userId) })
      toast.success(role === 'primary' ? 'Carteira principal salva' : 'Carteira secundária salva')
      onSaved?.()
    },
    onError: (error) => applyApiError(form.setError, error),
  })

  const root = form.formState.errors.root?.message

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      noValidate
      aria-label={role === 'primary' ? 'Carteira principal' : 'Carteira secundária'}
      className="grid gap-6"
    >
      <WalletFields form={form} />
      {root && (
        <p role="alert" className="text-sm text-destructive">
          {root}
        </p>
      )}
      <div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
      </div>
    </form>
  )
}

export default WalletSection
