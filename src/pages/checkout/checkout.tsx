import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import SummaryRows from '@/components/cart/summary-rows'
import Breadcrumb from '@/components/layout/breadcrumb'
import MobilePageHeader from '@/components/layout/mobile-page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cartKey } from '@/domain/cart/queries'
import { createOrder } from '@/domain/orders/api'
import type { CreateOrderRequest } from '@/domain/orders/schema'
import { quoteQuery } from '@/domain/quote/queries'
import { updateWallet } from '@/domain/wallets/api'
import { walletsKey, walletsQuery } from '@/domain/wallets/queries'
import { walletFields, walletInput, walletProviders, type Wallet, type WalletInput } from '@/domain/wallets/schema'
import { useSession } from '@/features/auth/use-session'
import { useCart } from '@/features/cart/use-cart'
import { providerLabels } from '@/features/catalog/labels'
import { formatEth } from '@/lib/eth'
import { applyApiError } from '@/lib/form-errors'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import WalletFields from '@/components/wallet/wallet-fields'
import WalletCards from './wallet-cards'

const staleCodes = ['QUOTE_STALE', 'QUOTE_EXPIRED', 'AVAILABILITY_CONFLICT']

const toInput = (wallet: Wallet): WalletInput => walletFields.parse(wallet)

function Checkout() {
  const { data: session } = useSession()
  const userId = session?.user.id ?? ''
  const cart = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const lines = cart.items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity }))
  const quote = useQuery({
    ...quoteQuery({ items: lines, coupon: cart.coupon ?? undefined }),
    enabled: lines.length > 0,
  })
  const wallets = useQuery({ ...walletsQuery(userId), enabled: !!session })

  const [walletId, setWalletId] = useState<string>()
  const [note, setNote] = useState('')
  const [changed, setChanged] = useState(false)
  const attempt = useRef<{ fingerprint: string; key: string; body: CreateOrderRequest }>(undefined)
  // Armazena o payload e a chave da tentativa caso ocorra timeout para reenviar com idempotência garantida
  const unconfirmed = useRef<{ key: string; body: CreateOrderRequest } | null>(null)
  const [canRetry, setCanRetry] = useState(false)

  const wallet = wallets.data?.find((w) => w.id === walletId) ?? wallets.data?.[0]
  const form = useForm<WalletInput>({ resolver: zodResolver(walletInput), values: wallet && toInput(wallet) })
  const network = form.watch('network') ?? wallet?.network ?? 'ethereum'
  const provider = form.watch('provider')
  const connected = !!wallet && wallet.connection?.network === network

  const current = quote.data
  const hasIssue = !!current?.items.some((item) => item.issue)

  // Guarda o valor total revisado pelo comprador e exige confirmação caso a cotação seja atualizada
  const [reviewed, setReviewed] = useState<string>()
  if (current && reviewed === undefined) setReviewed(current.total)
  const needsReview = changed || (!!current && reviewed !== undefined && reviewed !== current.total)

  const place = useMutation({
    mutationFn: async (values: WalletInput) => {
      if (unconfirmed.current) return createOrder(unconfirmed.current.body, unconfirmed.current.key)
      if (!current || !wallet) throw new Error('Pedido incompleto.')
      const saved = toInput(wallet)
      if ((Object.keys(values) as (keyof WalletInput)[]).some((field) => values[field] !== saved[field])) {
        await updateWallet(wallet.id, values)
        queryClient.invalidateQueries({ queryKey: walletsKey(userId) })
      }
      const body: CreateOrderRequest = {
        quoteId: current.id,
        walletId: wallet.id,
        network: values.network,
        note: note.trim() || undefined,
      }
      const fingerprint = JSON.stringify(body)
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID(), body }
      return createOrder(body, attempt.current.key)
    },
    onSuccess: (order) => {
      unconfirmed.current = null
      queryClient.invalidateQueries({ queryKey: cartKey(userId) })
      navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'TIMEOUT') {
        unconfirmed.current = attempt.current ? { key: attempt.current.key, body: attempt.current.body } : null
        setCanRetry(!!unconfirmed.current)
      } else {
        // Se o servidor respondeu com erro explícito (exceto timeout), o pedido não chegou a ser persistido
        unconfirmed.current = null
        setCanRetry(false)
      }

      if (error instanceof ApiError && staleCodes.includes(error.code)) {
        setChanged(true)
        quote.refetch()
      } else if (error instanceof ApiError && error.code === 'TIMEOUT') {
        toast.error('A conexão demorou. Confirme de novo: o pedido não será duplicado.')
      } else if (error instanceof ApiError && error.fields && Object.keys(error.fields).length) {
        applyApiError(form.setError, error)
      } else {
        toast.error(error.message)
      }
    },
  })

  const submit = form.handleSubmit((values) => {
    setChanged(false)
    place.mutate(values)
  })

  if (!cart.isPending && cart.items.length === 0 && canRetry) {
    return (
      <div className="mx-auto flex max-w-300 flex-col items-center gap-4 px-6 py-16 text-center">
        <p role="alert" className="text-sm">
          A conexão demorou e o pedido pode já ter sido criado. Confirme de novo: ele não será duplicado.
        </p>
        <Button disabled={place.isPending} onClick={() => place.mutate(form.getValues())}>
          {place.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
        </Button>
      </div>
    )
  }

  if (!cart.isPending && cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-300 flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild>
          <Link to="/" hash="catalogo">
            Explorar NFTs
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 px-6 py-6 max-md:pb-8 md:py-10 xl:px-0">
      <Breadcrumb current="Pagamento" />
      <MobilePageHeader title="Pagamento com carteira" />

      <form onSubmit={submit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <section aria-labelledby="collector" className="space-y-4">
            <h1 id="collector" className="text-sm font-bold">
              Perfil do colecionador
            </h1>
            {wallet && <WalletFields form={form} />}
          </section>

          <section aria-label="Carteira" className="space-y-4">
            {wallets.isPending ? (
              <Skeleton className="h-28 w-full" />
            ) : wallets.isError ? (
              <div role="alert" className="flex flex-col items-start gap-3">
                <p className="text-sm">Não foi possível carregar as carteiras.</p>
                <Button type="button" onClick={() => wallets.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : wallet ? (
              <WalletCards userId={userId} wallets={wallets.data} selected={wallet} network={network} onSelect={setWalletId} />
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm">
                <p>Você ainda não cadastrou carteiras.</p>
                <Link to="/wallets" className="mt-2 inline-block font-bold text-text-accent hover:underline">
                  Cadastrar carteira
                </Link>
              </div>
            )}
          </section>

          <section aria-labelledby="note-title" className="space-y-2">
            <h2 id="note-title" className="text-xs font-bold">
              Observação do colecionador (opcional)
            </h2>
            <Textarea
              aria-labelledby="note-title"
              value={note}
              maxLength={280}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-28 max-w-sm"
            />
          </section>
        </div>

        <aside aria-label="Revisão do pedido" className="space-y-5">
          <h2 className="text-sm font-bold">Seus NFTs</h2>
          <ul className="space-y-2">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-2">
                <img src={item.image.variants[0]?.url ?? item.image.url} alt="" width={36} height={36} className="size-9 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{item.name}</span>
                <span className="text-tiny text-text-secondary">(x {item.quantity})</span>
                <span className="text-xs font-bold text-text-accent">{formatEth(item.unitPrice)}</span>
              </li>
            ))}
          </ul>

          <SummaryRows totals={current} />

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold">Carteira e rede</legend>
            {walletProviders.map((item) => (
              <label
                key={item}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  provider === item && 'border-primary',
                )}
              >
                <input
                  type="radio"
                  name="provider-choice"
                  value={item}
                  checked={provider === item}
                  onChange={() => form.setValue('provider', item, { shouldDirty: true, shouldValidate: true })}
                  className="sr-only"
                />
                <span aria-hidden className={cn('size-3 shrink-0 rounded-full border-2 border-primary', provider === item && 'bg-primary')} />
                {providerLabels[item]}
              </label>
            ))}
          </fieldset>

          {needsReview && (
            <div role="alert" className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <p>Os valores ou a disponibilidade mudaram. Revise o total e confirme novamente.</p>
              <Button
                type="button"
                size="sm"
                disabled={!current || quote.isFetching}
                onClick={() => {
                  setReviewed(current?.total)
                  setChanged(false)
                }}
              >
                Aceitar novos valores
              </Button>
            </div>
          )}
          {hasIssue && (
            <p role="alert" className="text-sm text-destructive">
              Alguns itens não estão mais disponíveis. Ajuste o carrinho para continuar.
            </p>
          )}
          {wallet && !connected && (
            <p role="status" className="text-xs text-text-secondary">
              Conecte a carteira na rede selecionada para enviar o pedido.
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full max-md:rounded-full max-md:bg-linear-to-br max-md:from-primary max-md:to-[color-mix(in_oklab,var(--primary),black_30%)] max-md:font-bold md:h-9"
            disabled={!current || !connected || hasIssue || needsReview || place.isPending || quote.isFetching}
          >
            {place.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
          </Button>
        </aside>
      </form>
    </div>
  )
}

export default Checkout
