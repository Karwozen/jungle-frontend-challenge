import { test, expect } from '@playwright/test'

test('galeria desktop seleciona as miniaturas originais pelo teclado', async ({ page, isMobile }) => {
  test.skip(isMobile, 'As miniaturas ficam na versão desktop do Figma')
  await page.goto('/nfts/emerald-ape-42')
  const first = page.getByRole('button', { name: 'Mostrar imagem 1 de 4' })
  const second = page.getByRole('button', { name: 'Mostrar imagem 2 de 4' })
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(second).toHaveAttribute('aria-pressed', 'true')
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.detail-art img')).toHaveAttribute('src', /emerald-ape-960\.webp$/)
  await page.evaluate(() => {
    const key = 'kurio.mock.database.v2'
    const db = JSON.parse(localStorage.getItem(key)!)
    const nft = db.nfts.find((item: { id: string }) => item.id === 'emerald-ape-42')
    nft.gallery = ['/assets/art/emerald-ape', '/assets/art/sage-nomad']
    localStorage.setItem(key, JSON.stringify(db))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Mostrar imagem 2 de 2' }).click()
  await expect(page.locator('.detail-art img')).toHaveAttribute('src', /sage-nomad-960\.webp$/)
})

test('galeria mobile permite trocar imagens diferentes quando disponíveis', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Comportamento específico do mobile')
  await page.goto('/nfts/emerald-ape-42')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.evaluate(() => {
    const key = 'kurio.mock.database.v2'
    const db = JSON.parse(localStorage.getItem(key)!)
    db.nfts.find((item: { id: string }) => item.id === 'emerald-ape-42').gallery = ['/assets/art/emerald-ape', '/assets/art/sage-nomad']
    localStorage.setItem(key, JSON.stringify(db))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Mostrar imagem 2 de 2' }).click()
  await expect(page.locator('.detail-art img')).toHaveAttribute('src', /sage-nomad-960\.webp$/)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('detalhe mobile oferece retorno e favorito acessíveis', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Controles específicos do layout mobile')
  await page.goto('/nfts/emerald-ape-42')
  const back = page.getByRole('link', { name: 'Voltar ao mercado' })
  const favorite = page.getByRole('button', { name: 'Adicionar aos favoritos' })
  await expect(back).toBeVisible()
  await expect(favorite).toBeVisible()
  const favoriteBox = await favorite.boundingBox()
  const imageBox = await page.locator('.detail-art').boundingBox()
  expect(favoriteBox!.y + favoriteBox!.height).toBeLessThanOrEqual(imageBox!.y)
  await favorite.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/login/)
  await page.goBack()
  await expect(back).toBeVisible()
  await back.click()
  await expect(page).toHaveURL(/#market/)
})

test('revisão da página inicial com assets originais', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('NFTs encontrados')
  const images = page.locator('.nft-grid').first().getByRole('img')
  await expect(images).toHaveCount(9)
  for (const image of await images.all()) {
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth > 0)).toBe(true)
    await expect(image).toHaveAttribute('src', /(?:emerald-ape|sage-nomad|neon-vessel|golden-beat)-480\.webp$/)
  }
  await expect(page.locator('img[src*="zeus"], img[src*="athena"]')).toHaveCount(0)
  await page.screenshot({ path: `output/correction-home-${testInfo.project.name}.png`, fullPage: true })
})

test('diálogo de autenticação contém foco e fecha pelo teclado', async ({ page }, testInfo) => {
  await page.goto('/login')
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('E-mail', { exact: true })).toBeFocused()
  for (let step = 0; step < 12; step++) {
    await page.keyboard.press('Tab')
    await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  await page.screenshot({ path: `output/correction-login-${testInfo.project.name}.png` })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/?(?:\?.*)?$/)
})
