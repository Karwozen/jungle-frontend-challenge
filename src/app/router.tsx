import { createRootRoute, createRoute, createRouter, defaultParseSearch, lazyRouteComponent, Link, redirect } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../shared/api'
import { queryClient } from './query'
import { createSocket } from './realtime'
import type { CatalogResponse, Nft, ResourceEvent } from '../shared/contracts'
import { Button } from '../components/ui/button'
import { Catalog } from '../features/catalog/Catalog'
import { catalogSearch } from '../shared/catalog'
import { StorefrontShell } from './StorefrontShell'
import { sessionQuery } from '../features/account/session'
import { safeReturnTo } from '../shared/account'

const defaultSearch = { q: '', collection: '', sort: 'recent' as const, page: 1 }
const rootRoute = createRootRoute({ component: StorefrontShell, notFoundComponent: () => <main className="mx-auto max-w-6xl px-6 py-20"><h1>Página não encontrada</h1><Link to="/" search={defaultSearch}>Voltar ao início</Link></main> })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: search => catalogSearch.parse(search), component: Catalog })
const detailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nfts/$nftId', component: lazyRouteComponent(() => import('../features/catalog/NftDetail'), 'NftDetail') })
const foundationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/foundation', component: Foundation })
const scenarioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/demo/scenarios', component: lazyRouteComponent(() => import('../features/demo/ScenarioPage'), 'ScenarioPage') })
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: lazyRouteComponent(() => import('../features/cart/CartPage'), 'CartPage') })
const authSearch = (search: Record<string, unknown>) => ({ returnTo: safeReturnTo(search.returnTo) })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', validateSearch: authSearch, component: lazyRouteComponent(() => import('../features/account/AccountPages'), 'LoginPage') })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', validateSearch: authSearch, component: lazyRouteComponent(() => import('../features/account/AccountPages'), 'RegisterPage') })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account/profile', beforeLoad: async ({ location }) => {
  const session = await queryClient.fetchQuery(sessionQuery)
  if (!session.user) throw redirect({ to: '/login', search: { returnTo: location.href } })
}, component: lazyRouteComponent(() => import('../features/account/AccountPages'), 'ProfilePage') })
const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account/favorites',
  beforeLoad: async ({ location }) => {
    const session = await queryClient.fetchQuery(sessionQuery)
    if (!session.user) throw redirect({ to: '/login', search: { returnTo: location.href } })
  },
  component: lazyRouteComponent(() => import('../features/catalog/FavoriteCollection'), 'FavoriteCollection'),
})
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account/wallets', beforeLoad: async ({ location }) => {
  const session = await queryClient.fetchQuery(sessionQuery)
  if (!session.user) throw redirect({ to: '/login', search: { returnTo: location.href } })
}, component: lazyRouteComponent(() => import('../features/account/AccountPages'), 'WalletsPage') })
const checkoutGuard = async ({ location }: { location: { href: string } }) => { const session = await queryClient.fetchQuery(sessionQuery); if (!session.user) throw redirect({ to: '/login', search: { returnTo: location.href } }) }
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', beforeLoad: checkoutGuard, component: lazyRouteComponent(() => import('../features/cart/CheckoutPage'), 'CheckoutPage') })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout/orders/$orderId', beforeLoad: checkoutGuard, component: lazyRouteComponent(() => import('../features/cart/CheckoutPage'), 'OrderPage') })
export const router = createRouter({ parseSearch: raw => { const parsed: Record<string, unknown> = { ...defaultParseSearch(raw) }, params = new URLSearchParams(raw); for (const key of ['minPrice', 'maxPrice']) { const value = params.get(key); if (value !== null) { try { const json: unknown = JSON.parse(value); parsed[key] = typeof json === 'string' ? json : value } catch { parsed[key] = value } } } return parsed }, routeTree: rootRoute.addChildren([indexRoute, detailRoute, foundationRoute, scenarioRoute, loginRoute, registerRoute, profileRoute, walletsRoute, favoritesRoute, cartRoute, checkoutRoute, orderRoute]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
function Foundation() {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState('Nenhum evento recebido')
  const catalog = useQuery({ queryKey: ['nfts', 'foundation'], queryFn: async ({ signal }) => (await api.get<CatalogResponse>('/nfts', { signal })).data })
  useEffect(() => {
    const socket = createSocket()
    const update = (event: ResourceEvent<Nft>) => {
      setLastEvent(`${event.data.name} · versão ${event.version}`)
      queryClient.setQueryData<CatalogResponse>(['nfts', 'foundation'], old => old && ({ ...old, items: old.items.map(nft => nft.id === event.resourceId && nft.version < event.version ? event.data : nft) }))
    }
    socket.on('connect', () => { setConnected(true); void queryClient.invalidateQueries({ queryKey: ['nfts'] }) })
    socket.on('disconnect', () => setConnected(false))
    socket.on('nft.updated', update)
    socket.connect()
    return () => { socket.removeAllListeners(); socket.disconnect() }
  }, [])
  const mutation = useMutation({ mutationFn: () => api.post('/demo/nft-update') })
  return <main id="content" className="mx-auto max-w-6xl px-6 py-12"><p className="text-primary">Fundação · etapa 1</p><h1 className="mt-3 text-3xl">REST e tempo real</h1><p className="mt-4 text-muted-foreground">Esta página verifica os transportes simulados antes de implementar os fluxos de compra.</p><p role="status" className="my-5">Socket.IO: {connected ? 'conectado' : 'conectando'}</p><Button disabled={!connected || mutation.isPending} onClick={() => mutation.mutate()}>Simular alteração de preço</Button><p aria-live="polite" className="mt-4" data-testid="last-event">{lastEvent}</p>{mutation.isError && <p role="alert">Falha ao emitir evento. Tente novamente.</p>}{catalog.isPending ? <div aria-label="Carregando catálogo" className="mt-8 grid gap-5 sm:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-sm"/>)}</div> : catalog.isError ? <div role="alert"><p>Não foi possível carregar o catálogo.</p><Button onClick={() => void catalog.refetch()}>Tentar novamente</Button></div> : <ul className="mt-8 grid gap-5 sm:grid-cols-2">{catalog.data.items.map(nft => <li key={nft.id} className="border border-border bg-card p-6"><p className="text-xs text-primary">{nft.collection}</p><h2 className="mt-2 text-xl">{nft.name}</h2><p className="mt-3" data-testid={`price-${nft.id}`}>{nft.price} ETH</p><p className="text-muted-foreground text-sm">{nft.available} disponíveis · versão {nft.version}</p></li>)}</ul>}</main>
}
