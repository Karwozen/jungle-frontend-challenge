import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import NotFound from '@/components/layout/not-found'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { orderQuery } from '@/domain/orders/queries'
import { useSession } from '@/features/auth/use-session'
import { networkLabels } from '@/features/catalog/labels'
import { formatEth } from '@/lib/eth'
import { ApiError } from '@/lib/http'
import { outOfScope } from '@/lib/out-of-scope'

const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const shorten = (hash: string) => (hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash)

function Order() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const { data: session } = useSession()
  const { data: order, error, isPending, refetch } = useQuery({
    ...orderQuery(session?.user.id ?? '', orderId),
    enabled: !!session,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  })

  if (isPending) {
    return (
      <div aria-busy className="mx-auto w-full max-w-xl space-y-4 px-6 py-10">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (error) {
    if (error instanceof ApiError && (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN')) return <NotFound />
    return (
      <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-sm">Não foi possível carregar o pedido.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  const heading = {
    pending: { icon: Clock, title: 'Aguardando confirmação na rede', tone: 'text-text-accent' },
    confirmed: { icon: CheckCircle2, title: 'Seus NFTs agora estão na sua carteira', tone: 'text-text-accent' },
    refused: { icon: XCircle, title: 'Pagamento recusado', tone: 'text-destructive' },
  }[order.status]
  const Icon = heading.icon

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-8 md:py-12">
      <div className="rounded-lg border-b-[3px] border-b-primary bg-card">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 px-6 pt-8 pb-5 text-center">
          <Icon aria-hidden className={`size-12 ${heading.tone}`} />
          <h1 className="text-sm font-bold">{heading.title}</h1>
          {order.status === 'pending' && (
            <p className="text-xs text-text-secondary">
              Seu pedido foi enviado e está sendo processado. Você pode recarregar a página: ele não será duplicado.
            </p>
          )}
          {order.status === 'refused' && (
            <p className="text-xs text-text-secondary">{order.failureReason ?? 'A carteira recusou a transação.'}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-primary/60 px-6 py-3 text-xs md:grid-cols-4 md:gap-0 md:divide-x md:divide-primary/60 md:px-0 md:*:px-4">
          <div>
            <dt className="font-bold">ID da transação</dt>
            <dd className="break-all text-text-secondary">{order.txHash ? shorten(order.txHash) : order.id}</dd>
          </div>
          <div>
            <dt className="font-bold">Data</dt>
            <dd className="text-text-secondary">{day.format(new Date(order.createdAt))}</dd>
          </div>
          <div>
            <dt className="font-bold">Total</dt>
            <dd className="text-text-secondary">{formatEth(order.total, { minDecimals: 3 })}</dd>
          </div>
          <div>
            <dt className="font-bold">Carteira</dt>
            <dd className="text-text-secondary">{order.wallet.displayName}</dd>
          </div>
        </dl>

        <section aria-labelledby="receipt" className="px-6 py-5">
          <h2 id="receipt" className="mb-3 text-xs font-bold">
            Detalhes da transação
          </h2>
          <div aria-hidden className="grid grid-cols-[1fr_4rem_5rem] border-b border-border-soft pb-2 text-xs font-bold">
            <span>NFTs</span>
            <span className="text-center">Edições</span>
            <span className="text-right">Subtotal</span>
          </div>
          <ul className="mt-3 space-y-3">
            {order.items.map((item) => (
              <li key={`${item.nftId}:${item.editionId}`} className="grid grid-cols-[1fr_4rem_5rem] items-center gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <img src={item.image.variants[0]?.url ?? item.image.url} alt="" width={36} height={36} className="size-9 shrink-0 rounded-md object-cover" />
                  <span className="min-w-0 text-xs font-bold">{item.name}</span>
                </div>
                <span className="text-center text-xs text-text-secondary">(x {item.quantity})</span>
                <span className="text-right text-xs font-bold text-text-accent">{formatEth(item.total)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-border-soft pt-4 text-xs">
            <div className="flex justify-end gap-8">
              <dt>Subtotal</dt>
              <dd className="w-20 text-right">{formatEth(order.subtotal)}</dd>
            </div>
            {order.coupon && (
              <div className="flex justify-end gap-8">
                <dt>Desconto ({order.coupon.code})</dt>
                <dd className="w-20 text-right">-{formatEth(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-end gap-8">
              <dt>Taxa de rede</dt>
              <dd className="w-20 text-right">{formatEth(order.networkFee, { minDecimals: 3 })}</dd>
            </div>
            <div className="flex justify-end gap-8 text-sm font-bold">
              <dt>Total</dt>
              <dd className="w-20 text-right text-text-accent">{formatEth(order.total, { minDecimals: 3 })}</dd>
            </div>
          </dl>

          {order.status === 'confirmed' && (
            <p className="mt-6 text-center text-xs text-text-secondary">
              Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para sua carteira
              conectada e registrada na rede.
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {order.status === 'confirmed' && (
              <Button type="button" onClick={outOfScope}>
                Ver no Etherscan
              </Button>
            )}
            {order.status === 'refused' && (
              <Button asChild>
                <Link to="/cart">Voltar ao carrinho</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/" hash="catalogo">
                Continuar explorando
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Order
