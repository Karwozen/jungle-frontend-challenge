import { expect, test, type Page } from '@playwright/test'
import { api, buyFromDetail, catalogCards, checkout, login, logout, mock, open, summary, theo } from './support'

const emerald = 'emerald-ape-042'
const live = (page: Page) => page.locator('p[role=status].sr-only').first()

// o cliente do Socket.IO conecta depois da primeira renderização; o app marca o estado no <html>
async function connected(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-realtime', 'connected', { timeout: 15_000 })
}

// quantas conexões o servidor simulado tem agora (derrubá-las faz o cliente reconectar)
const sockets = async (page: Page) => (await mock.disconnect(page))?.closed ?? 0

// no mobile o preço do desktop existe no DOM mas fica oculto; só interessa o que está visível
const showing = (page: Page, text: string) => page.getByText(text).locator('visible=true').first()

test.describe('nft.updated pelo Socket.IO', () => {
  test('atualiza o preço no detalhe sem recarregar @mobile', async ({ page }) => {
    await open(page, `/nft/${emerald}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(showing(page, '1.19 ETH')).toBeVisible()
    await mock.patchNft(page, emerald, { price: '2.5' })
    await expect(showing(page, '2.50 ETH')).toBeVisible()
  })

  test('atualiza o card no catálogo', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await mock.patchNft(page, emerald, { price: '3.1' })
    await expect(page.locator('#catalogo ul li', { hasText: 'Emerald Ape #042' }).first()).toContainText('3.10 ETH')
  })

  test('marca o NFT como esgotado no detalhe quando o estoque acaba', async ({ page }) => {
    await open(page, `/nft/${emerald}`)
    const detail = await api<{ editions: { id: string }[] }>(page, `/api/nfts/${emerald}`)
    await mock.patchNft(page, emerald, { stock: Object.fromEntries(detail.editions.map((e) => [e.id, 0])) })
    await expect(page.getByRole('button', { name: 'Esgotado' })).toBeDisabled()
  })

  test('com o carrinho aberto avisa a alteração e atualiza o resumo @mobile', async ({ page }) => {
    await buyFromDetail(page, emerald)
    await expect.poll(async () => (await summary(page))['Subtotal']).toBeGreaterThan(0)
    const before = (await summary(page))['Subtotal']
    await mock.patchNft(page, emerald, { price: '4' })
    await expect(page.getByText(/agora é 4\.00 ETH/).first()).toBeVisible()
    await expect.poll(async () => (await summary(page))['Subtotal']).not.toBe(before)
    expect((await summary(page))['Subtotal']).toBeCloseTo(4, 3)
    await expect(live(page)).toContainText('Emerald Ape')
  })

  test('o carrinho do usuário também é atualizado pelo evento', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, emerald)
    await expect.poll(async () => (await summary(page))['Subtotal']).toBeCloseTo(1.19, 3)
    await mock.patchNft(page, emerald, { price: '5' })
    await expect.poll(async () => (await summary(page))['Subtotal']).toBeCloseTo(5, 3)
  })

  test('esgotar um item do carrinho avisa e bloqueia a finalização', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, emerald)
    const detail = await api<{ editions: { id: string }[] }>(page, `/api/nfts/${emerald}`)
    await mock.patchNft(page, emerald, { stock: Object.fromEntries(detail.editions.map((e) => [e.id, 0])) })
    await expect(page.getByText(/esgotou/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
  })

  test('mudança de preço durante o pagamento exige aceitar os novos valores antes de confirmar', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, emerald)
    await checkout(page, { confirm: false })
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()

    await mock.patchNft(page, emerald, { price: '6' })
    await expect(page.getByText('Os valores ou a disponibilidade mudaram. Revise o total e confirme novamente.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
    await expect.poll(async () => (await summary(page))['Subtotal']).toBeCloseTo(6, 3)

    await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    await expect(page.getByText(/6\.016 ETH/).first()).toBeVisible()
  })
})

test.describe('eventos duplicados, antigos e fora de ordem', () => {
  test('evento duplicado não reaplica e evento antigo não regride o preço', async ({ page }) => {
    await open(page, `/nft/${emerald}`)
    await expect(showing(page, '1.19 ETH')).toBeVisible()
    await connected(page)
    await expect(showing(page, '1.19 ETH')).toBeVisible()

    await mock.patchNft(page, emerald, { price: '2' })
    await expect(showing(page, '2.00 ETH')).toBeVisible()
    await mock.patchNft(page, emerald, { price: '3' })
    await expect(showing(page, '3.00 ETH')).toBeVisible()

    const events = (await mock.events(page)).filter((e) => e.resource.id === emerald)
    expect(events.length).toBeGreaterThanOrEqual(2)
    // reenvia o mais antigo (versão menor) e o mais novo (duplicata): o preço continua o último
    await mock.replay(page, events[0].id)
    await mock.replay(page, events.at(-1)!.id)
    await page.waitForTimeout(500)
    await expect(showing(page, '3.00 ETH')).toBeVisible()
  })

  test('o aviso do carrinho aparece uma vez só por evento, mesmo reenviado', async ({ page }) => {
    await buyFromDetail(page, emerald)
    await connected(page)
    await mock.patchNft(page, emerald, { price: '2' })
    await expect(page.getByText(/agora é 2\.00 ETH/).first()).toBeVisible()
    const toasts = () => page.locator('[data-sonner-toast]').count()
    const before = await toasts()
    const [event] = (await mock.events(page)).filter((e) => e.resource.id === emerald)
    await mock.replay(page, event.id)
    await mock.replay(page, event.id)
    await page.waitForTimeout(500)
    expect(await toasts()).toBe(before)
  })
})

test.describe('desconexão e reconexão', () => {
  test('anuncia a queda e a volta e reconcilia o que foi perdido com o REST @mobile', async ({ page }) => {
    await open(page, `/nft/${emerald}`)
    await expect(showing(page, '1.19 ETH')).toBeVisible()
    await connected(page)

    // o servidor muda enquanto a conexão está fora: o evento se perde e só o REST traz o valor novo
    await mock.disconnect(page)
    await expect(page.locator('html')).toHaveAttribute('data-realtime', 'disconnected')
    await mock.patchNft(page, emerald, { price: '5' })
    await expect(showing(page, '5.00 ETH')).toBeVisible({ timeout: 15_000 })
    await expect(live(page)).toContainText('restabelecida')
  })

  test('há exatamente um socket por página, mesmo depois de entrar e sair', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await connected(page)
    await expect.poll(async () => (await sockets(page)), { timeout: 15_000 }).toBe(1)

    await login(page)
    await expect(page.getByRole('button', { name: /juliana/ })).toBeVisible()
    await expect.poll(async () => (await sockets(page)), { timeout: 15_000 }).toBe(1)

    await logout(page)
    await expect.poll(async () => (await sockets(page)), { timeout: 15_000 }).toBe(1)
  })

  test('trocar de usuário reabre o socket com a sessão nova', async ({ page }) => {
    await login(page)
    await open(page, '/')
    await expect.poll(async () => (await sockets(page)), { timeout: 15_000 }).toBe(1)
    await logout(page)
    await login(page, theo)
    await open(page, '/')
    await expect.poll(async () => (await sockets(page)), { timeout: 15_000 }).toBe(1)
  })

  test('com o servidor de socket fora do ar o app segue funcionando por REST', async ({ page }) => {
    await open(page, '/?scenario=socket-offline&on=socket')
    await expect(catalogCards(page).first()).toBeVisible()
    await open(page, `/nft/${emerald}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await mock.scenario(page, 'default')
  })
})

test.describe('order.updated', () => {
  test('pedido recusado pelo servidor aparece como recusado na hora', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, emerald)
    await mock.scenario(page, 'manual-settlement', ['orders'])
    await checkout(page)
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeVisible()
    const id = new URL(page.url()).pathname.split('/').pop()!
    await mock.settle(page, id, 'refused')
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
    await expect(live(page)).toContainText('Pedido recusado')
  })

  test('um evento antigo de pedido não faz um pedido confirmado voltar a pendente', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, emerald)
    await checkout(page)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    const events = (await mock.events(page)).filter((e) => e.type === 'order.updated')
    expect(events.length).toBeGreaterThan(0)
    await mock.replay(page, events[0].id)
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeHidden()
  })

  test('eventos de pedido de uma sessão anterior não chegam à pessoa que entrou depois', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, emerald)
    await mock.scenario(page, 'manual-settlement', ['orders'])
    await checkout(page)
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeVisible()
    const id = new URL(page.url()).pathname.split('/').pop()!

    await logout(page)
    await login(page, theo)
    await open(page, '/')
    await connected(page)
    await expect.poll(async () => (await sockets(page)), { timeout: 15_000 }).toBe(1)

    // o servidor liquida o pedido da Juliana: a conexão do Theo não pode receber nada disso
    await mock.settle(page, id, 'confirmed')
    await page.waitForTimeout(800)
    await expect(live(page)).not.toContainText('Pedido')
    await open(page, `/orders/${id}`)
    await expect(page.getByText('Página não encontrada')).toBeVisible()
  })
})
