import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'

interface Totals {
  subtotal: string
  discount: string
  networkFee: string
  total: string
}

function SummaryRows({ totals }: { totals?: Totals }) {
  if (!totals) {
    return (
      <div aria-busy className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  return (
    <dl className="space-y-2 text-xs md:text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd>{formatEth(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Desconto do lançamento</dt>
        <dd>(-) {formatEth(totals.discount, { unit: false })}</dd>
      </div>
      <div>
        <div className="flex justify-between">
          <dt>Taxa de rede</dt>
          <dd>{formatEth(totals.networkFee, { minDecimals: 3 })}</dd>
        </div>
        <p className="text-right text-tiny text-text-accent">Taxa estimada</p>
      </div>
      <div className="flex items-center justify-between border-t border-border-soft pt-3 text-sm font-bold md:text-base">
        <dt>Total</dt>
        <dd className="text-text-accent">{formatEth(totals.total, { minDecimals: 3 })}</dd>
      </div>
    </dl>
  )
}

export default SummaryRows
