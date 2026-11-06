import { Link } from '@tanstack/react-router'
import { MailCheck, Clock3, CircleX, X } from 'lucide-react'
import type { Order } from '../../shared/orders'
import { parseEth, serializeEth } from '../../shared/money'
import { AuxiliaryAction } from '../../components/AuxiliaryAction'
import { Artwork } from '../catalog/Artwork'

export function OrderReceipt({ order }: { order: Order }) {
  const confirmed = order.status === 'confirmed'
  const Icon = confirmed ? MailCheck : order.status === 'pending' ? Clock3 : CircleX
  return <section className="order-receipt">
    <Link to="/" search={{ q: '', collection: '', page: 1, sort: 'recent' }} className="receipt-close" aria-label="Fechar recibo"><X size={20}/></Link>
    <Icon className="receipt-icon" size={64} strokeWidth={1.2} aria-hidden="true"/>
    <h1>{confirmed ? 'Pedido confirmado' : order.status === 'declined' ? 'Pagamento recusado' : 'Acompanhamento do pedido'}</h1>
    <p role="status">{order.status === 'pending' ? 'Pagamento pendente. Você pode recarregar esta página com segurança.' : order.status === 'declined' ? order.reason : 'Obrigado pela compra! Seus NFTs agora estão na sua carteira simulada.'}</p>
    <dl className="order-identification">
      <div><dt>Pedido</dt><dd title={order.id}>{order.id}</dd></div>
      <div><dt>Data</dt><dd>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</dd></div>
      {confirmed && <><div><dt>Transação simulada</dt><dd title={order.transaction}>{order.transaction}</dd></div><div><dt>Carteira</dt><dd>{order.wallet.label} · {order.wallet.network}</dd></div></>}
    </dl>
    {confirmed && <>
      <h2>Detalhes da transação</h2>
      <div className="receipt-table-wrap"><table className="receipt-items"><thead><tr><th scope="col">NFT</th><th scope="col">Qtd.</th><th scope="col">Total</th></tr></thead><tbody>
        {order.cart.items.map(item => <tr key={item.id}><td><div className="receipt-nft"><div className="checkout-thumbnail"><Artwork nft={item.nft}/></div><div><strong>{item.nft.name}</strong><p>Edição: {item.edition?.name || 'Padrão'}</p><p>{item.nft.price} ETH por unidade</p></div></div></td><td><span aria-hidden="true">(x </span>{item.quantity}<span aria-hidden="true">)</span></td><td>{serializeEth(parseEth(item.nft.price) * BigInt(item.quantity))} ETH</td></tr>)}
      </tbody></table></div>
      <dl className="receipt-totals">{[['Subtotal', order.cart.subtotal], ['Desconto', order.cart.discount], ['Taxa de rede', order.cart.networkFee], ['Total', order.cart.total]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value} ETH</dd></div>)}</dl>
      <p className="receipt-order-id">Pedido {order.id}</p>
      <AuxiliaryAction title="Explorador simulado" description={`Transação ${order.transaction}. Este identificador pertence à demonstração e não existe em uma blockchain real.`}>Ver transação no explorador simulado ↗</AuxiliaryAction>
    </>}
    <Link to="/cart" className="order-return">Voltar ao carrinho</Link>
  </section>
}
