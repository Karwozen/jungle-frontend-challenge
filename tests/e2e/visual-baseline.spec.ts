import { test, expect } from '@playwright/test'

test.skip(process.platform !== 'win32', 'As referências foram capturadas no Chromium para Windows; outros sistemas precisam de referências próprias.')

test('referência visual da página inicial', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('NFTs encontrados')
  const image = page.locator('.hero-art img')
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true)
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('inicio.png', { animations: 'disabled' })
})

test('referência visual do detalhe de NFT', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  const image = page.locator('.detail-art img')
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true)
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('detalhe.png', { animations: 'disabled' })
})

test('referência visual do carrinho', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  await expect(page.getByText('1.255 ETH', { exact: true })).toBeVisible()
  const image = page.locator('.cart-thumbnail img')
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true)
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('carrinho.png', { animations: 'disabled' })
})

test('referência visual do pagamento', async ({ page }) => {
  await page.goto('/account/profile')
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/account\/profile/)
  await page.getByRole('navigation', { name: 'Conta do colecionador' }).getByRole('link', { name: 'Carteiras', exact: true }).click()
  await page.getByLabel('Nome da carteira').fill('Principal')
  await page.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Principal · Principal')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Carteira e rede' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /Principal/ })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('pagamento.png', { animations: 'disabled', fullPage: true })
})
