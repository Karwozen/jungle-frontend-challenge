import { expect, test, type Page } from '@playwright/test'
import { buyFromDetail, catalogCards, juliana, login, open } from './support'

const widths = [390, 768, 1440]

async function noHorizontalOverflow(page: Page, label: string) {
  await page.waitForTimeout(500)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `${label}: ${overflow}px de rolagem horizontal`).toBeLessThanOrEqual(0)
}

for (const width of widths) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 844 } })

    test('visitante: início, detalhe, carrinho e 404 sem overflow horizontal', async ({ page }) => {
      await open(page, '/')
      await expect(catalogCards(page).first()).toBeVisible()
      await noHorizontalOverflow(page, `início ${width}`)

      await open(page, '/nft/emerald-ape-042')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await noHorizontalOverflow(page, `detalhe ${width}`)

      await buyFromDetail(page, 'violet-nomad-314')
      await noHorizontalOverflow(page, `carrinho ${width}`)

      await open(page, '/rota-que-nao-existe')
      await expect(page.getByText('Página não encontrada')).toBeVisible()
      await noHorizontalOverflow(page, `404 ${width}`)
    })

    test('usuário: pagamento, carteiras, perfil e favoritos sem overflow horizontal', async ({ page }) => {
      await login(page)
      await buyFromDetail(page, 'violet-nomad-314')
      await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
      await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
      await noHorizontalOverflow(page, `pagamento ${width}`)

      for (const [route, ready] of [
        ['/wallets', page.getByRole('form', { name: 'Carteira principal' })],
        ['/profile', page.getByRole('form', { name: 'Dados do perfil' })],
        ['/favorites', page.getByRole('list', { name: 'NFTs favoritados' })],
      ] as const) {
        await open(page, route)
        await expect(ready).toBeVisible()
        await noHorizontalOverflow(page, `${route} ${width}`)
      }
    })

    test('diálogo de login cabe na tela', async ({ page }) => {
      await open(page, '/?auth=login')
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const box = (await dialog.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
      await noHorizontalOverflow(page, `login ${width}`)
    })

    test('a navegação principal é a certa para o tamanho', async ({ page }) => {
      await open(page, '/')
      await expect(catalogCards(page).first()).toBeVisible()
      const header = page.locator('header').first()
      const tabBar = page.locator('nav.fixed[aria-label="Principal"]')
      if (width < 768) {
        await expect(tabBar).toBeVisible()
        await expect(header).toBeHidden()
      } else {
        await expect(header).toBeVisible()
        await expect(tabBar).toBeHidden()
      }
    })

    test('o pedido confirmado cabe na tela', async ({ page }) => {
      await login(page, juliana)
      await buyFromDetail(page, 'emerald-ape-042')
      await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
      await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
      const connect = page.getByRole('button', { name: /Conectar na/ })
      if (await connect.count()) await connect.click()
      await expect(page.getByText(/Conectada em/)).toBeVisible()
      await page.getByRole('button', { name: 'Confirmar compra' }).click()
      await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
      await noHorizontalOverflow(page, `recibo ${width}`)
    })
  })
}
