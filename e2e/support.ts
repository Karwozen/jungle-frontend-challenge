import { expect, type Page } from '@playwright/test'

export const juliana = { email: 'juliana@kurio.dev', password: 'Kurio@2026', username: 'juliana' }
export const theo = { email: 'theo@kurio.dev', password: 'Kurio@2026', username: 'theo' }

// cada teste roda num contexto novo, então o banco do mock (localStorage) já nasce no estado inicial;
// motion=off tira as animações decorativas e fica salvo para as próximas navegações
export async function open(page: Page, path = '/') {
  await page.goto(`${path}${path.includes('?') ? '&' : '?'}motion=off`)
}

export async function login(page: Page, user = juliana) {
  await open(page, '/?auth=login')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(user.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(user.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

export async function logout(page: Page) {
  const isMobile = (page.viewportSize()?.width ?? 1440) < 768
  if (isMobile) {
    await page.goto('/profile')
    await page.getByRole('navigation', { name: 'Minha conta' }).getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.locator('header button[aria-haspopup="menu"]').click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kurio.token'))).toBeNull()
}

// antes de o MSW assumir a página o fetch cairia no servidor do Vite
async function mswReady(page: Page) {
  await page.waitForFunction(async () => {
    try {
      return (await (await fetch('/api/health')).json()).status === 'ok'
    } catch {
      return false
    }
  })
}

// as mesmas rotas de apoio que o painel de mocks usa: o servidor muda e o app recebe pelo REST e pelo socket
async function control<T>(page: Page, path: string, method = 'POST', body?: unknown): Promise<T> {
  await mswReady(page)
  return page.evaluate(
    async ([path, method, body]) => {
      // o MSW pode assumir a página um instante depois do primeiro GET: enquanto vier 404 do Vite, tenta de novo
      for (let attempt = 0; attempt < 30; attempt++) {
        const response = await fetch(`/api/__mock${path}`, {
          method: method as string,
          headers: { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        if (response.status !== 404) {
          const text = await response.text()
          if (!response.ok) throw new Error(`controle ${path} respondeu ${response.status}: ${text}`)
          return text ? JSON.parse(text) : null
        }
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
      throw new Error(`controle ${path} não foi atendido pelo MSW`)
    },
    [path, method, body] as const,
  ) as Promise<T>
}

export const mock = {
  scenario: (page: Page, name: string, on: string[] = []) => control(page, '/scenario', 'POST', { name, on }),
  patchNft: (page: Page, id: string, body: { price?: string; stock?: Record<string, number | null> }) =>
    control<{ id: string; version: number }>(page, `/nfts/${id}`, 'PATCH', body),
  settle: (page: Page, orderId: string, outcome: 'confirmed' | 'refused') =>
    control(page, `/orders/${orderId}/settle`, 'POST', { outcome }),
  events: (page: Page) =>
    control<{ id: string; type: string; resource: { type: string; id: string }; version: number }[]>(page, '/events', 'GET'),
  replay: (page: Page, eventId: string) => control(page, '/events/replay', 'POST', { eventId }),
  disconnect: (page: Page) => control<{ closed: number }>(page, '/socket/disconnect'),
  reset: (page: Page) => control(page, '/reset'),
}

// os filtros em lista vão para a URL como JSON, então os testes leem o valor decodificado
export const param = (page: Page, key: string) => new URL(page.url()).searchParams.get(key)

// chamada REST feita pela própria página, depois de o MSW assumir
export async function api<T>(page: Page, path: string): Promise<T> {
  await mswReady(page)
  // a primeira chamada logo depois de carregar pode ainda cair no servidor do Vite; repete até vir JSON
  return page.evaluate(async (path) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const response = await fetch(path)
      if (response.headers.get('content-type')?.includes('json')) return response.json()
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
    throw new Error(`sem JSON em ${path}`)
  }, path) as Promise<T>
}

export const catalogCards = (page: Page) => page.locator('#catalogo ul li a[href^="/nft/"]')

// compra direto do detalhe e cai no carrinho
export async function buyFromDetail(page: Page, nftId: string, quantity = 1) {
  await open(page, `/nft/${nftId}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (let i = 1; i < quantity; i++) await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: /^Comprar/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

export async function cartCount(page: Page) {
  return page.evaluate(async () => {
    const token = localStorage.getItem('kurio.token') ?? ''
    const response = await fetch('/api/cart', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    return response.ok ? (await response.json()).items.length : -1
  })
}

// vai do carrinho ao pagamento, conecta a carteira se precisar e confirma
export async function checkout(page: Page, { confirm = true } = {}) {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
  const connect = page.getByRole('button', { name: /Conectar na/ })
  if (await connect.count()) {
    await connect.click()
    await expect(page.getByText(/Conectada em/)).toBeVisible()
  }
  if (confirm) await page.getByRole('button', { name: 'Confirmar compra' }).click()
}

// ativos do app que ficam atrás do conteúdo e mudam de uma execução para outra
export async function hideMockPanel(page: Page) {
  await page.addStyleTag({ content: '[aria-label="Painel de mocks"] { visibility: hidden !important }' })
}

// lê os valores do resumo (carrinho ou pagamento) como números; o desconto vem sem o sinal
export async function summary(page: Page) {
  return page.evaluate(() => {
    const values: Record<string, number> = {}
    document
      .querySelectorAll('aside[aria-label="Resumo do pedido"] dl > div, aside[aria-label="Revisão do pedido"] dl > div')
      .forEach((row) => {
        const label = row.querySelector('dt')?.textContent?.trim()
        const text = row.querySelector('dd')?.textContent ?? ''
        if (label) values[label] = Math.abs(parseFloat(text.replace(/[^0-9.-]/g, '')))
      })
    return values
  })
}

// pedidos do usuário logado, direto da API simulada
export async function orders(page: Page) {
  return page.evaluate(async () => {
    const token = localStorage.getItem('kurio.token') ?? ''
    const response = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
    return (await response.json()) as { id: string; status: string; total: string; items: { nftId: string }[] }[]
  })
}
