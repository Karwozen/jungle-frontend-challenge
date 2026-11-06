import { expect, test, type Page } from '@playwright/test'
import { buyFromDetail, catalogCards, login, open } from './support'

// dados estáveis: sem animações (motion=off e animations: 'disabled'), sem o painel de mocks nem avisos por cima,
// com fontes e imagens carregadas, e o mesmo estado inicial dos mocks em cada teste
async function stabilize(page: Page) {
  await page.addStyleTag({
    content: '[aria-label="Painel de mocks"], [data-sonner-toaster] { visibility: hidden !important }',
  })
  await page.evaluate(async () => {
    await document.fonts.ready
    for (const image of Array.from(document.images)) image.loading = 'eager'
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.complete ? undefined : new Promise((resolve) => { image.onload = image.onerror = resolve }),
      ),
    )
  })
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(300)
}

const shot = (page: Page, name: string, fullPage = true) =>
  expect(page).toHaveScreenshot(`${name}.png`, { fullPage, mask: [page.locator('time')] })

test.describe('regressão visual', () => {
  test('início @mobile', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await stabilize(page)
    await shot(page, 'inicio')
  })

  test('detalhe do NFT @mobile', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.locator('#related-title')).toBeVisible()
    await stabilize(page)
    await shot(page, 'detalhe')
  })

  test('carrinho @mobile', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('2')
    await expect(page.locator('aside[aria-label="Resumo do pedido"] dl')).toBeVisible()
    await stabilize(page)
    await shot(page, 'carrinho')
  })

  test('pagamento @mobile', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
    await expect(page.locator('aside[aria-label="Revisão do pedido"] dl')).toBeVisible()
    await stabilize(page)
    await shot(page, 'pagamento')
  })

  test('confirmação do pedido @mobile', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
    await page.getByRole('button', { name: /Conectar na/ }).click()
    await expect(page.getByText(/Conectada em/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    await stabilize(page)
    // a data e o código da transação mudam a cada execução: ficam fora da comparação
    await expect(page).toHaveScreenshot('confirmacao.png', {
      fullPage: true,
      mask: [page.locator('dl').first(), page.locator('time')],
    })
  })

  test('login em diálogo @mobile', async ({ page }) => {
    await open(page, '/?auth=login')
    await expect(page.getByRole('dialog')).toBeVisible()
    await stabilize(page)
    await shot(page, 'login', false)
  })

  test('carteiras @mobile', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    await expect(page.getByRole('form', { name: 'Carteira principal' })).toBeVisible()
    await stabilize(page)
    await shot(page, 'carteiras')
  })

  test('perfil @mobile', async ({ page }) => {
    await login(page)
    await open(page, '/profile')
    await expect(page.getByRole('form', { name: 'Dados do perfil' })).toBeVisible()
    await stabilize(page)
    await shot(page, 'perfil')
  })
})
