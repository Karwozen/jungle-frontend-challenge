import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import axios from 'axios'
import { api } from '../../shared/api'
import type { Nft } from '../../shared/contracts'
import { queryClient } from '../../app/query'
import { parseEth, serializeEth } from '../../shared/money'
import { Button } from '../../components/ui/button'
export function AddToCart({ nft, editionId = 'standard' }: { nft: Nft; editionId?: string }) {
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  const mutation = useMutation({ mutationFn: () => api.post('/cart', { nftId: nft.id, editionId, quantity }), onSuccess: async () => { await queryClient.invalidateQueries({ predicate: query => query.queryKey[2] === 'cart' }); await navigate({ to: '/cart' }) } })
  const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= nft.available
  const total = validQuantity ? serializeEth(parseEth(nft.price) * BigInt(quantity)) : nft.price
  return <section className="add-to-cart" aria-label="Comprar NFT">
    <div className="purchase-quantity"><label htmlFor="purchase-quantity">Quantidade</label><button type="button" aria-label="Diminuir quantidade" disabled={mutation.isPending || !Number.isInteger(quantity) || quantity <= 1} onClick={() => setQuantity(value => value - 1)}>−</button><input id="purchase-quantity" type="number" value={Number.isNaN(quantity) ? '' : quantity} min={1} max={nft.available} onChange={e => setQuantity(e.target.valueAsNumber)}/><button type="button" aria-label="Aumentar quantidade" disabled={mutation.isPending || !Number.isInteger(quantity) || quantity >= nft.available} onClick={() => setQuantity(value => value + 1)}>+</button></div>
    <p className="purchase-total" aria-label="Total dos itens">{total} ETH</p>
    <Button className="purchase-submit" disabled={mutation.isPending || !validQuantity} onClick={() => mutation.mutate()}>{!nft.available ? 'Esgotado' : mutation.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}</Button>
    {mutation.isError && <p role="alert" className="field-error">{axios.isAxiosError(mutation.error) ? mutation.error.response?.data.message || 'Falha de conexão. Tente novamente.' : 'Não foi possível adicionar.'}</p>}
  </section>
}
