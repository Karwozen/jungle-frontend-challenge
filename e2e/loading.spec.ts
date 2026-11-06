import { expect, test } from '@playwright/test'
import { buyFromDetail, catalogCards, login, mock, open } from './support'

// liga o cenário pelas rotas de controle e só então navega: a URL com ?scenario= seria relida a cada requisição
async function visitWith(page: import('@playwright/test').Page, scenario: string, on: string[], path = '/') {
  await open(page, '/')
  await mock.scenario(page, scenario, on)
  await page.goto(path)
}

test.describe('carregamento lento: skeletons', () => {
  test('catálogo mostra o skeleton enquanto carrega e depois os cards @mobile', async ({ page }) => {
    await visitWith(page, 'slow', ['nfts'])
    const skeleton = page.locator('#catalogo ul[aria-busy="true"]')
    await expect(skeleton).toBeVisible()
    expect(await skeleton.locator('li').count()).toBe(9)
    await expect(catalogCards(page).first()).toBeVisible({ timeout: 20_000 })
    await expect(skeleton).toBeHidden()
  })

  test('o skeleton tem o brilho (shimmer) e o brilho some com movimento reduzido @mobile', async ({ page }) => {
    // motion=off é a chave dos testes que desliga as animações; aqui o movimento precisa estar ligado
    await page.goto('/?motion=on')
    await mock.scenario(page, 'slow', ['nfts'])
    await page.goto('/')
    const shimmer = (target: import('@playwright/test').Page) =>
      target
        .locator('#catalogo ul[aria-busy="true"] li')
        .first()
        .locator('[data-slot=skeleton]')
        .first()
        .evaluate((el) => getComputedStyle(el, '::after').animationName)

    await expect(page.locator('#catalogo ul[aria-busy="true"]')).toBeVisible()
    expect(await shimmer(page)).toBe('shimmer')

    const quiet = await page.context().newPage()
    await quiet.emulateMedia({ reducedMotion: 'reduce' })
    await quiet.goto('/')
    await expect(quiet.locator('#catalogo ul[aria-busy="true"]')).toBeVisible()
    expect(await shimmer(quiet)).toBe('none')
  })

  test('detalhe mostra o skeleton e depois o conteúdo sem pular de lugar @mobile', async ({ page }) => {
    await visitWith(page, 'slow', ['detail'], '/nft/emerald-ape-042')
    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  })

  test('resumo do carrinho mostra skeleton enquanto a cotação carrega', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await expect.poll(async () => (await page.getByText('Total').count()) > 0).toBe(true)
    await mock.scenario(page, 'slow', ['quote'])
    await page.reload()
    await expect(page.locator('aside[aria-label="Resumo do pedido"] [aria-busy="true"]')).toBeVisible()
    await expect(page.locator('aside[aria-label="Resumo do pedido"] dl')).toBeVisible({ timeout: 20_000 })
  })

  test('o layout não pula: a altura do catálogo se mantém depois de carregar', async ({ page }) => {
    await visitWith(page, 'slow', ['nfts'])
    const grid = page.locator('#catalogo ul[aria-busy="true"]')
    await expect(grid).toBeVisible()
    const loadingHeight = (await grid.boundingBox())!.height
    await expect(catalogCards(page).first()).toBeVisible({ timeout: 20_000 })
    const loaded = await page.locator('#catalogo ul', { has: page.locator('a[href^="/nft/"]') }).first().boundingBox()
    expect(Math.abs(loaded!.height - loadingHeight) / loadingHeight).toBeLessThan(0.35)
  })
})

test.describe('falhas e recuperação', () => {
  test('erro 500 no catálogo mostra o feedback e a nova tentativa recupera @mobile', async ({ page }) => {
    await visitWith(page, 'server-error', ['nfts'])
    await expect(page.getByText('Não foi possível carregar os NFTs.')).toBeVisible({ timeout: 25_000 })
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(catalogCards(page).first()).toBeVisible()
  })

  test('sem conexão: o catálogo avisa e volta quando a rede volta', async ({ page }) => {
    await visitWith(page, 'offline', ['nfts'])
    await expect(page.getByText('Não foi possível carregar os NFTs.')).toBeVisible({ timeout: 25_000 })
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(catalogCards(page).first()).toBeVisible()
  })

  test('timeout no detalhe mostra o erro e a nova tentativa funciona', async ({ page }) => {
    test.setTimeout(90_000)
    await visitWith(page, 'timeout', ['detail'], '/nft/emerald-ape-042')
    await expect(page.getByText('Não foi possível carregar este NFT.')).toBeVisible({ timeout: 60_000 })
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('erro 500 no detalhe mostra o feedback e recupera', async ({ page }) => {
    await visitWith(page, 'server-error', ['detail'], '/nft/emerald-ape-042')
    await expect(page.getByText('Não foi possível carregar este NFT.')).toBeVisible({ timeout: 25_000 })
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('erro ao carregar o carrinho mostra feedback e permite tentar de novo', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
    await mock.scenario(page, 'server-error', ['cart'])
    await page.reload()
    await expect(page.getByText('Não foi possível carregar o carrinho.')).toBeVisible({ timeout: 25_000 })
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toBeVisible()
  })

  test('erro ao carregar as avaliações mostra feedback local e recupera', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await mock.scenario(page, 'server-error', ['reviews'])
    await page.getByRole('tab', { name: /Avaliações/ }).click()
    await expect(page.getByText('Não foi possível carregar as avaliações.')).toBeVisible({ timeout: 25_000 })
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#panel-reviews li').first()).toBeVisible()
  })

  test('um erro de validação 422 da API chega ao campo do formulário', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    const form = page.getByRole('form', { name: 'Carteira principal' })
    await form.locator('input[name=address]').fill('0x' + 'ab12cd34ef'.repeat(4))
    await form.locator('input[name=alias]').fill('x')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.locator('input[name=alias]')).toHaveAttribute('aria-invalid', 'true')
  })

  test('catálogo vazio vem do cenário e some quando o cenário volta ao normal', async ({ page }) => {
    await visitWith(page, 'empty', ['nfts'])
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await mock.scenario(page, 'default')
    // a consulta vazia continua em cache por 30 s; recarregar busca de novo
    await page.reload()
    await expect(catalogCards(page).first()).toBeVisible()
  })
})

test.describe('latência variável e respostas fora de ordem', () => {
  test('digitar rápido na busca termina com o resultado da última consulta', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await mock.scenario(page, 'jitter', ['nfts'])
    const search = page.getByPlaceholder('Buscar por nome, coleção ou token')
    for (const text of ['g', 'go', 'gol', 'gold', 'golde', 'golden']) {
      await search.fill(text)
      await page.waitForTimeout(60)
    }
    await expect.poll(
      async () => {
        const names = await catalogCards(page).locator('h3').allTextContents()
        return names.length > 0 && names.every((name) => name.toLowerCase().includes('golden'))
      },
      { timeout: 30_000 },
    ).toBe(true)
  })

  test('trocar de aba e de página rápido não deixa dados de uma consulta velha na tela', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await mock.scenario(page, 'jitter', ['nfts'])
    await page.getByRole('link', { name: 'Em alta' }).click()
    await page.getByRole('link', { name: 'Novos lançamentos' }).click()
    await page.getByRole('link', { name: 'Todos os NFTs' }).click()
    await expect(page.getByRole('link', { name: 'Todos os NFTs' })).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('#catalogo ul[aria-busy="true"]')).toBeHidden({ timeout: 30_000 })
    await expect(catalogCards(page)).toHaveCount(9, { timeout: 30_000 })
  })
})
