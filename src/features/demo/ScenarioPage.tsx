import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '../../shared/api'
import { Button } from '../../components/ui/button'

export function ScenarioPage() {
  const current = useQuery({ queryKey: ['demo', 'network-scenario'], queryFn: async () => (await api.get<{ mode: string; scope: string; method: string }>('/demo/network-scenario')).data })
  const network = useMutation({ mutationFn: (data: unknown) => api.post('/demo/network-scenario', data), onSuccess: () => { void current.refetch() } })
  const payment = useMutation({ mutationFn: (scenario: string) => api.post('/demo/payment-scenario', { scenario }) })
  const socket = useMutation({ mutationFn: () => api.post('/demo/socket-disconnect', { pauseMs: 3500 }) })
  return <main id="content" className="market-container"><section className="auth-panel"><h1>Cenários da demonstração</h1><p className="auth-subtitle">Configure as falhas simuladas e abra o fluxo que deseja avaliar. As configurações de rede persistem após recarregar a página.</p>
    {current.data && <p>Rede ativa: {current.data.mode} · {current.data.method} {current.data.scope}</p>}
    <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); network.mutate({ mode: data.get('mode'), scope: data.get('scope'), method: data.get('method'), delays: String(data.get('delays')).split(',').map(value => Number(value.trim())), remaining: data.get('remaining') ? Number(data.get('remaining')) : null }) }}>
      <div className="form-field"><label htmlFor="scenario-mode">Condição de rede</label><select id="scenario-mode" name="mode"><option value="normal">Normal</option><option value="offline">Sem conexão</option><option value="server-error">Erro HTTP 503</option><option value="slow">Latência variável</option><option value="timeout">Timeout antes de processar</option></select></div>
      <div className="form-field"><label htmlFor="scenario-scope">Rota da API</label><input id="scenario-scope" name="scope" defaultValue="/api" required/></div>
      <div className="form-field"><label htmlFor="scenario-method">Método</label><select id="scenario-method" name="method">{['*', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map(method => <option key={method}>{method}</option>)}</select></div>
      <div className="form-field"><label htmlFor="scenario-delays">Latências em ms, separadas por vírgula</label><input id="scenario-delays" name="delays" defaultValue="1200,100" required/></div>
      <div className="form-field"><label htmlFor="scenario-remaining">Limite de requisições (vazio: contínuo)</label><input id="scenario-remaining" name="remaining" type="number" min="0" max="100"/></div>
      <Button disabled={network.isPending}>Aplicar rede</Button><Button type="button" variant="ghost" disabled={network.isPending} onClick={() => network.mutate({ mode: 'normal' })}>Restaurar rede normal</Button>
    </form>
    {network.isSuccess && <p role="status">Configuração de rede aplicada.</p>}{network.isError && <p role="alert">Revise a rota, as latências e o limite de requisições.</p>}
    <form className="nft-story" onSubmit={event => { event.preventDefault(); payment.mutate(String(new FormData(event.currentTarget).get('payment'))) }}><div className="form-field"><label htmlFor="scenario-payment">Pagamento</label><select id="scenario-payment" name="payment"><option value="success">Confirmado</option><option value="declined">Recusado</option><option value="timeout">Timeout após criar o pedido</option></select></div><Button disabled={payment.isPending}>Aplicar pagamento</Button></form>
    {payment.isSuccess && <p role="status">Cenário de pagamento aplicado.</p>}{payment.isError && <p role="alert">Não foi possível aplicar o cenário.</p>}
    <div className="nft-story"><Button disabled={socket.isPending} onClick={() => socket.mutate()}>Interromper Socket.IO por 3,5 segundos</Button>{socket.isSuccess && <p role="status">Interrupção disparada. Os clientes tentarão reconectar.</p>}{socket.isError && <p role="alert">Não foi possível interromper a conexão.</p>}</div>
    <Link className="text-link" to="/" search={{ q: '', collection: '', page: 1, sort: 'recent' }}>Abrir marketplace</Link>
  </section></main>
}
