import { expect, test } from '@playwright/test'
import { catalogCards, login, mock, open, theo } from './support'

const heart = (card: import('@playwright/test').Locator) => card.getByRole('button', { name: /favoritos/ })

test.describe('favoritos', () => {
  test('visitante é levado ao login ao tocar no coração @mobile', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await heart(page.locator('#catalogo ul li:has(a[href^="/nft/"])').filter({ visible: true }).first()).click({ force: true })
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(page.url()).toContain('auth=login')
  })

  test('favoritar e desfavoritar alternam o estado e persistem depois do refresh @mobile', async ({ page }) => {
    await login(page)
    await open(page, '/')
    const card = page.locator('#catalogo ul li:has(a[href^="/nft/"])').filter({ visible: true }).nth(1)
    await expect(catalogCards(page).first()).toBeVisible()
    await card.hover()
    const button = heart(card)
    const before = (await button.getAttribute('aria-pressed')) === 'true'

    const saved = page.waitForResponse((r) => r.url().includes('/api/favorites/'))
    await button.click({ force: true })
    await saved
    await expect(button).toHaveAttribute('aria-pressed', String(!before))

    await page.reload()
    await expect(catalogCards(page).first()).toBeVisible()
    const again = heart(page.locator('#catalogo ul li:has(a[href^="/nft/"])').filter({ visible: true }).nth(1))
    await expect(again).toHaveAttribute('aria-pressed', String(!before))
  })

  test('a atualização é otimista e volta ao estado anterior quando a API falha', async ({ page }) => {
    await login(page)
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await mock.scenario(page, 'server-error', ['favorites'])

    const card = page.locator('#catalogo ul li:has(a[href^="/nft/"])').filter({ visible: true }).nth(2)
    await card.hover()
    const button = heart(card)
    const before = await button.getAttribute('aria-pressed')
    await button.click({ force: true })

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible()
    await expect(button).toHaveAttribute('aria-pressed', before!)
  })

  test('depois da falha, com o servidor de volta, a mesma ação funciona', async ({ page }) => {
    await login(page)
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await mock.scenario(page, 'server-error', ['favorites'])
    const card = page.locator('#catalogo ul li:has(a[href^="/nft/"])').filter({ visible: true }).nth(2)
    await card.hover()
    const button = heart(card)
    const before = await button.getAttribute('aria-pressed')
    await button.click({ force: true })
    await expect(button).toHaveAttribute('aria-pressed', before!)

    await mock.scenario(page, 'default')
    await button.click({ force: true })
    await expect(button).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true')
  })

  test('a lista de interesse mostra os favoritos do usuário e remove ao desfavoritar', async ({ page }) => {
    await login(page)
    await open(page, '/favorites')
    const list = page.getByRole('list', { name: 'NFTs favoritados' })
    await expect(list.locator('> li')).toHaveCount(2)
    const first = list.locator('> li').first()
    await first.hover()
    const removed = page.waitForResponse((r) => r.url().includes('/api/favorites/') && r.request().method() === 'DELETE')
    await first.getByRole('button', { name: /Remover dos favoritos/ }).click()
    await removed
    await expect(list.locator('> li')).toHaveCount(1)
    await page.reload()
    await expect(page.getByRole('list', { name: 'NFTs favoritados' }).locator('> li')).toHaveCount(1)
  })

  test('cada usuário vê só os próprios favoritos', async ({ page }) => {
    await login(page, theo)
    await open(page, '/favorites')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  })

  test('lista vazia convida a explorar o catálogo', async ({ page }) => {
    await login(page, theo)
    await open(page, '/favorites')
    await page.getByRole('link', { name: 'Explorar NFTs' }).click()
    await expect(page).toHaveURL(/#catalogo/)
  })
})
