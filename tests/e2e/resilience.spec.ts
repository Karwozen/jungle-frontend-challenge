import { test, expect } from '@playwright/test'

test('painel aplica cenários persistentes e permite normalizar a rede', async ({ page }) => {
  await page.goto('/demo/scenarios')
  await page.getByLabel('Condição de rede').selectOption('server-error')
  await page.getByLabel('Rota da API').fill('/api/cart')
  await page.getByLabel('Método', { exact: true }).selectOption('PATCH')
  await page.getByRole('button', { name: 'Aplicar rede', exact: true }).click()
  await expect(page.getByText('Rede ativa: server-error · PATCH /api/cart')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Rede ativa: server-error · PATCH /api/cart')).toBeVisible()
  await page.getByRole('button', { name: 'Restaurar rede normal' }).click()
  await expect(page.getByText('Rede ativa: normal · * /api')).toBeVisible()
})

test('latências configuradas produzem respostas fora de ordem', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('NFTs encontrados')
  const result = await page.evaluate(async () => {
    await fetch('/api/demo/network-scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'slow', scope: '/api/nfts', method: 'GET', delays: [1200, 0] }) })
    const completed: string[] = []
    const first = fetch('/api/nfts?q=Emerald').then(response => response.json()).then(data => { completed.push('first'); return data })
    const second = fetch('/api/nfts?q=Sage').then(response => response.json()).then(data => { completed.push('second'); return data })
    const values = await Promise.all([first, second])
    return { completed, names: values.map(value => value.items[0].name) }
  })
  expect(result.completed).toEqual(['second', 'first'])
  expect(result.names).toEqual(['Emerald Ape #042', 'Sage Nomad #009'])
})

test('catálogo mantém esqueleto enquanto a API está lenta e exibe os resultados', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('NFTs encontrados')
  await page.evaluate(async () => {
    await fetch('/api/demo/network-scenario', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'slow', scope: '/api/nfts', method: 'GET', delays: [3000] }),
    })
  })
  await page.reload()
  await expect(page.getByLabel('Carregando NFTs')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('NFTs encontrados')
  await expect(page.getByLabel('Carregando NFTs')).toHaveCount(0)
})

test('falha de conexão preserva carrinho e permite repetir alteração', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('1.255 ETH', { exact: true })).toBeVisible()
  await page.evaluate(async () => { await fetch('/api/demo/network-scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'offline', scope: '/api/cart', method: 'PATCH', remaining: 1 }) }) })
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042 — 1/50' }).click()
  await expect(page.getByRole('alert')).toContainText('Falha de conexão')
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveValue('1')
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042 — 1/50' }).click()
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveValue('2')
  await expect(page.getByText('2.505 ETH', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveValue('2')
})

test('timeout antes de processar preserva a quantidade do carrinho', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('1.255 ETH', { exact: true })).toBeVisible()
  await page.evaluate(async () => { await fetch('/api/demo/network-scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'timeout', scope: '/api/cart', method: 'PATCH', remaining: 1 }) }) })
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042 — 1/50' }).click()
  await expect(page.getByRole('alert')).toContainText('Falha de conexão', { timeout: 16000 })
  await page.reload()
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveValue('1')
  await expect(page.getByText('1.255 ETH', { exact: true })).toBeVisible()
})

test('erro HTTP no detalhe tem recuperação sem perder a rota', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('NFTs encontrados')
  await page.evaluate(async () => { await fetch('/api/demo/network-scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'server-error', scope: '/api/nfts/emerald-ape-42' }) }) })
  await page.goto('/nfts/emerald-ape-42')
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir este NFT' })).toBeVisible()
  await page.evaluate(async () => { await fetch('/api/demo/network-scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'normal' }) }) })
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('Socket.IO reconecta e reconcilia preço alterado durante interrupção', async ({ page }) => {
  await page.goto('/demo/foundation')
  await expect(page.getByRole('status')).toHaveText('Socket.IO: conectado')
  const count = await page.evaluate(async () => (await (await fetch('/api/demo/realtime-status')).json()).connectionCount)
  await page.evaluate(async () => {
    await fetch('/api/demo/socket-disconnect', { method: 'POST' })
    await fetch('/api/demo/nft-update', { method: 'POST' })
  })
  await expect.poll(() => page.evaluate(async () => (await (await fetch('/api/demo/realtime-status')).json()).connectionCount)).toBeGreaterThan(count)
  await expect(page.getByRole('status')).toHaveText('Socket.IO: conectado')
  await expect(page.getByTestId('price-emerald-ape-42')).toHaveText('1.3 ETH')
})
