import { useState, type FormEvent } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Cart } from '@/domain/cart/schema'

interface CouponFormProps {
  applied: string | null
  percent?: number
  mutation: UseMutationResult<Cart, Error, string | null>
}

function CouponForm({ applied, percent, mutation }: CouponFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) {
      setError('Informe o cupom')
      return
    }
    setError(undefined)
    mutation.mutate(code.trim(), {
      onSuccess: () => {
        setCode('')
        toast.success('Cupom aplicado')
      },
      onError: (e) => setError(e.message),
    })
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p>
          Cupom <strong>{applied}</strong>
          {percent ? ` (${percent}% de desconto)` : ''}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => mutation.mutate(null)}>
          Remover cupom
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-1.5">
      <label htmlFor="coupon" className="text-xs font-bold max-md:sr-only">
        Código promocional
      </label>
      <div className="flex">
        <Input
          id="coupon"
          value={code}
          onChange={(event) => { setCode(event.target.value); if (error) setError(undefined) }}
          aria-invalid={!!error}
          aria-describedby={error ? 'coupon-error' : undefined}
          className="h-9 rounded-r-none border-border text-xs placeholder:text-gold"
          placeholder="Digite o código promocional..."
        />
        <Button type="submit" className="h-9 rounded-l-none px-4 text-xs" disabled={mutation.isPending}>
          Aplicar
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

export default CouponForm
