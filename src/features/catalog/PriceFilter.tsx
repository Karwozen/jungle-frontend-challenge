import { useState } from 'react'
import { parseEth } from '../../shared/money'
import { Button } from '../../components/ui/button'
export function PriceFilter({ minPrice, maxPrice, onApply }: { minPrice?: string; maxPrice?: string; onApply: (values: { minPrice?: string; maxPrice?: string }) => void }) {
  const [min, setMin] = useState(minPrice || '0.02')
  const [max, setMax] = useState(maxPrice || '12.30')
  const [error, setError] = useState('')
  return <form className="price-filter" onSubmit={event => { event.preventDefault(); if (parseEth(min || '0') > parseEth(max || '12.30')) { setError('O preço mínimo não pode ser maior que o máximo.'); return } setError(''); onApply({ minPrice: min || undefined, maxPrice: max || undefined }) }}>
    <h3>Faixa de preço</h3><div className="price-sliders"><input aria-label="Ajustar preço mínimo" type="range" min="0" max="12.30" step="0.01" value={Math.min(12.3, Number(min) || 0)} onChange={event => setMin(event.target.value)}/><input aria-label="Ajustar preço máximo" type="range" min="0" max="12.30" step="0.01" value={Math.min(12.3, Number(max) || 0)} onChange={event => setMax(event.target.value)}/></div>
    <div className="price-values"><span>Preço:</span><input aria-label="Preço mínimo (ETH)" type="text" inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,18})?" value={min} onChange={event => setMin(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'price-error' : undefined}/><span>–</span><input aria-label="Preço máximo (ETH)" type="text" inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,18})?" value={max} onChange={event => setMax(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'price-error' : undefined}/><span>ETH</span></div>
    {error && <p id="price-error" className="field-error" role="alert">{error}</p>}<Button type="submit">Aplicar</Button>
  </form>
}
