import { expect, test } from '@playwright/test'
import { api, buyFromDetail, login, mock, open } from './support'

const emerald = '/nft/emerald-ape-042'

test.describe('detalhe do NFT', () => {
  test('acesso direto mostra título, preço, edições e dados @mobile', async ({ page }) => {
    await open(page, emerald)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(4)
    await expect(page.getByText('ID do token:')).toBeVisible()
    await expect(page.getByText('Coleção:')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Comprar/ })).toBeEnabled()
  })

  test('NFT inexistente mostra a página não encontrada @mobile', async ({ page }) => {
    await open(page, '/nft/nao-existe-999')
    await expect(page.getByText('Página não encontrada')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar ao início' })).toBeVisible()
  })

  test('rota que não existe cai na página não encontrada', async ({ page }) => {
    await open(page, '/qualquer-coisa/que-nao-existe')
    await expect(page.getByText('Página não encontrada')).toBeVisible()
  })

  test('trocar a edição muda o preço e zera a quantidade', async ({ page }) => {
    await open(page, emerald)
    const price = page.locator('p.text-2xl.font-bold').first()
    const before = await price.textContent()
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(page.locator('output')).toHaveText('2')
    await page.getByRole('radio', { name: '1/10' }).click()
    await expect(price).not.toHaveText(before!)
    await expect(page.locator('output')).toHaveText('1')
  })

  test('edição 1/1 limita a quantidade a 1', async ({ page }) => {
    await open(page, emerald)
    await page.getByRole('radio', { name: '1/1', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
  })

  test('edição aberta limita pelo máximo por pedido (10)', async ({ page }) => {
    await open(page, emerald)
    await page.getByRole('radio', { name: 'Aberta' }).click()
    const more = page.getByRole('button', { name: 'Aumentar quantidade' })
    for (let i = 0; i < 9; i++) await more.click()
    await expect(page.locator('output')).toHaveText('10')
    await expect(more).toBeDisabled()
  })

  test('edição indisponível fica desabilitada e o NFT esgotado não pode ser comprado', async ({ page }) => {
    await open(page, emerald)
    const detail = await api<{ editions: { id: string }[] }>(page, '/api/nfts/emerald-ape-042')
    const editions = detail.editions.map((e) => e.id)
    // esgota só a edição 1/1: ela some das opções, as outras continuam à venda
    await mock.patchNft(page, 'emerald-ape-042', { stock: { [editions[0]]: 0 } })
    await expect(page.getByRole('radio', { name: '1/1', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: /^Comprar/ })).toBeEnabled()

    await mock.patchNft(page, 'emerald-ape-042', { stock: Object.fromEntries(editions.map((id: string) => [id, 0])) })
    await expect(page.getByRole('button', { name: 'Esgotado' })).toBeDisabled()
  })

  test('visitante adiciona ao carrinho e vê o aviso @mobile', async ({ page, isMobile }) => {
    await open(page, emerald)
    await page.getByRole('button', { name: isMobile ? 'Adicionar ao carrinho' : /^Comprar/ }).click()
    await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()
  })

  test('visitante que favorita é levado ao login e volta para o detalhe @mobile', async ({ page, isMobile }) => {
    await open(page, emerald)
    await page.getByRole('button', { name: isMobile ? 'Adicionar aos favoritos' : 'Favoritar' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(page.url()).toContain('auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill('juliana@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
    await expect(dialog).toBeHidden()
  })

  test('zoom abre a imagem em diálogo, prende o foco e devolve o foco ao fechar', async ({ page }) => {
    await open(page, emerald)
    const trigger = page.getByRole('button', { name: /Ampliar imagem/ })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('img', { name: 'Emerald Ape #042' })).toBeVisible()
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('abas: detalhes e avaliações com paginação @mobile', async ({ page }) => {
    await open(page, emerald)
    await expect(page.getByRole('tab', { name: 'Detalhes do NFT' })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('tab', { name: /Avaliações/ }).click()
    const reviews = page.locator('#panel-reviews li')
    await expect(reviews.first()).toBeVisible()
    const first = await reviews.first().textContent()
    await page.getByRole('button', { name: 'Próxima página' }).click()
    await expect(reviews.first()).not.toHaveText(first!)
    await page.getByRole('button', { name: 'Página anterior' }).click()
    await expect(reviews.first()).toHaveText(first!)
  })

  test('mais desta coleção lista outros NFTs e navega @mobile', async ({ page }) => {
    await open(page, emerald)
    const related = page.locator('#related-title').locator('xpath=..').locator('a[href^="/nft/"]')
    await expect(related.first()).toBeVisible()
    expect(await related.count()).toBeGreaterThan(1)
    await related.first().click()
    await expect(page).toHaveURL(/\/nft\//)
    await expect(page).not.toHaveURL(/emerald-ape-042/)
  })

  test('comprar leva ao carrinho com o item na quantidade escolhida @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314', 3)
    await expect(page.getByRole('list', { name: 'Itens do carrinho' }).locator('> li')).toHaveCount(1)
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('3')
  })

  test('favorito persiste depois do refresh para o usuário logado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'coberto no desktop')
    await login(page)
    await open(page, '/nft/sage-nomad-009')
    const button = page.getByRole('button', { name: 'Favoritar' })
    // o refresh só é justo depois de o servidor confirmar, senão a requisição em voo é cancelada
    const saved = page.waitForResponse((r) => r.url().includes('/api/favorites/') && r.request().method() === 'PUT')
    await button.click()
    await saved
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute('aria-pressed', 'true')
  })
})
