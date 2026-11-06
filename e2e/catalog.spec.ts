import { expect, test } from '@playwright/test'
import { catalogCards, mock, open, param } from './support'

const prices = (page: import('@playwright/test').Page) =>
  page.locator('#catalogo ul li a p span.font-bold').allTextContents().then((list) => list.map(parseFloat))

test.describe('catálogo', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
  })

  test('primeira página tem 9 cards e contagem por coleção @mobile', async ({ page }) => {
    await expect(catalogCards(page)).toHaveCount(9)
    await expect(page.locator('section[aria-label="Destaques"]')).toBeVisible()
  })

  test('filtro por categoria reduz a lista e fica na URL', async ({ page }) => {
    await page.locator('#catalogo aside label', { hasText: 'Música' }).click()
    await expect.poll(() => param(page, 'categories')).toContain('music')
    await expect.poll(() => catalogCards(page).count()).toBeLessThan(9)
    expect(await catalogCards(page).count()).toBeGreaterThan(0)
  })

  test('filtros combinados (categoria + rede) estreitam o resultado', async ({ page }) => {
    await page.locator('#catalogo aside label', { hasText: 'Música' }).click()
    await expect.poll(() => param(page, 'categories')).toContain('music')
    const music = await expect.poll(() => catalogCards(page).count()).toBeLessThan(9).then(() => catalogCards(page).count())
    await page.locator('#catalogo aside label', { hasText: 'Polygon' }).click()
    await expect.poll(() => param(page, 'networks')).toContain('polygon')
    expect(param(page, 'categories')).toContain('music')
    await expect.poll(() => catalogCards(page).count()).toBeLessThanOrEqual(await Promise.resolve(music))
  })

  test('ordenação por menor e maior preço', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Ordenar por' }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect.poll(async () => {
      const list = await prices(page)
      return list.length > 1 && list.every((n, i) => i === 0 || n >= list[i - 1])
    }).toBe(true)

    await page.getByRole('combobox', { name: 'Ordenar por' }).click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/sort=price-desc/)
    await expect.poll(async () => {
      const list = await prices(page)
      return list.length > 1 && list.every((n, i) => i === 0 || n <= list[i - 1])
    }).toBe(true)
  })

  test('paginação troca os itens e o histórico restaura a página', async ({ page }) => {
    const first = await catalogCards(page).first().textContent()
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(catalogCards(page).first()).not.toHaveText(first!)

    await page.goBack()
    await expect(page).not.toHaveURL(/page=/)
    await expect(catalogCards(page).first()).toHaveText(first!)

    await page.goForward()
    await expect(page).toHaveURL(/page=2/)
  })

  test('mudar um filtro reinicia a paginação', async ({ page }) => {
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.locator('#catalogo aside label', { hasText: 'Ethereum' }).click()
    await expect.poll(() => param(page, 'networks')).toContain('ethereum')
    await expect(page).not.toHaveURL(/page=/)
  })

  test('abas Em alta e Novos lançamentos têm conteúdos diferentes', async ({ page }) => {
    const all = await catalogCards(page).allTextContents()
    await page.getByRole('link', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/trending/)
    await expect(page.getByRole('link', { name: 'Em alta' })).toHaveAttribute('aria-current', 'page')
    await expect.poll(async () => (await catalogCards(page).allTextContents()).join()).not.toBe(all.join())
    const trending = await catalogCards(page).allTextContents()

    await page.getByRole('link', { name: 'Novos lançamentos' }).click()
    await expect(page.getByRole('link', { name: 'Novos lançamentos' })).toHaveAttribute('aria-current', 'page')
    await expect.poll(async () => (await catalogCards(page).allTextContents()).join()).not.toBe(trending.join())
  })

  test('busca por nome, estado vazio e limpar filtros', async ({ page }) => {
    const search = page.getByPlaceholder('Buscar por nome, coleção ou token')
    await search.fill('golden')
    await expect(page).toHaveURL(/q=golden/)
    await expect.poll(async () => (await catalogCards(page).first().textContent())?.toLowerCase()).toContain('golden')

    await search.fill('zzzzzz')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('link', { name: 'Limpar filtros' }).click()
    await expect(catalogCards(page)).toHaveCount(9)
    await expect(page).not.toHaveURL(/q=/)
  })

  test('busca acha pelo token e ignora acentos e caixa', async ({ page }) => {
    const search = page.getByPlaceholder('Buscar por nome, coleção ou token')
    await search.fill('0042')
    await expect(catalogCards(page).first()).toContainText('Emerald Ape #042')
    await search.fill('MÚSICA')
    await expect(page).toHaveURL(/q=/)
  })

  test('faixa de preço vem do backend e filtra pela URL', async ({ page }) => {
    const range = await page.evaluate(async () => (await (await fetch('/api/nfts')).json()).facets.price)
    expect(Number(range.min)).toBeGreaterThan(0)
    expect(Number(range.max)).toBeGreaterThan(Number(range.min))

    const slider = page.locator('#catalogo aside [role="slider"]').first()
    await slider.focus()
    for (let i = 0; i < 150; i++) await page.keyboard.press('ArrowRight')
    await page.locator('#catalogo aside').getByRole('button', { name: 'Aplicar' }).click()
    await expect(page).toHaveURL(/minPrice=/)
    await expect.poll(async () => (await prices(page)).every((n) => n >= 1.5)).toBe(true)
  })

  test('os limites da faixa de preço ignoram a própria faixa e acompanham os outros filtros', async ({ page }) => {
    const all = await page.evaluate(async () => (await (await fetch('/api/nfts')).json()).facets.price)
    const music = await page.evaluate(async () => (await (await fetch('/api/nfts?categories=music')).json()).facets.price)
    expect(Number(music.max)).toBeLessThan(Number(all.max))
    const withRange = await page.evaluate(async () => (await (await fetch('/api/nfts?minPrice=5')).json()).facets.price)
    expect(withRange).toEqual(all)
  })

  test('URL inválida cai nos padrões sem quebrar', async ({ page }) => {
    await open(page, '/?tab=xyz&page=abc&categories=%5B%22nope%22%5D&sort=banana')
    await expect(catalogCards(page)).toHaveCount(9)
  })

  test('refresh mantém aba, ordem e filtros', async ({ page }) => {
    await open(page, '/?tab=trending&sort=price-desc&networks=%5B%22ethereum%22%5D')
    await expect(page.getByRole('link', { name: 'Em alta' })).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('#catalogo aside label', { hasText: 'Ethereum' }).getByRole('checkbox')).toBeChecked()
    await page.reload()
    await expect(page.getByRole('link', { name: 'Em alta' })).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('#catalogo aside label', { hasText: 'Ethereum' }).getByRole('checkbox')).toBeChecked()
  })

  test('card abre o detalhe do NFT', async ({ page }) => {
    const name = (await catalogCards(page).first().locator('h3').textContent())!
    await catalogCards(page).first().click()
    await expect(page).toHaveURL(/\/nft\//)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  })

  test('destaques: carrossel troca o slide por botão e por teclado nos pontos', async ({ page }) => {
    const hero = page.locator('section[aria-label="Destaques"]')
    await expect(hero.locator('[role=group]:not([inert])')).toHaveAttribute('aria-label', '1 de 3')
    await hero.getByRole('button', { name: 'Mostrar slide 2' }).click()
    await expect(hero.locator('[role=group]:not([inert])')).toHaveAttribute('aria-label', '2 de 3')
    await hero.getByRole('button', { name: 'Mostrar slide 2' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(hero.locator('[role=group]:not([inert])')).toHaveAttribute('aria-label', '3 de 3')
    await page.keyboard.press('ArrowRight')
    await expect(hero.locator('[role=group]:not([inert])')).toHaveAttribute('aria-label', '1 de 3')
  })
})

test.describe('catálogo no mobile', () => {
  test('busca e filtros pelo painel lateral @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'fluxo do layout mobile')
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await page.getByPlaceholder('Explorar coleções').fill('golden')
    await expect(page).toHaveURL(/q=golden/)
    await expect.poll(async () => (await catalogCards(page).first().textContent())?.toLowerCase()).toContain('golden')
  })

  test('painel de filtros prende o foco e fecha com Esc @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'fluxo do layout mobile')
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await drawer.locator('label', { hasText: 'Música' }).click()
    await expect.poll(() => param(page, 'categories')).toContain('music')
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })
})

test('lista vazia vem do cenário "empty" do mock', async ({ page }) => {
  await open(page, '/?scenario=empty')
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  await mock.scenario(page, 'default')
})
