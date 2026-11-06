import { expect, test } from '@playwright/test'
import { api, buyFromDetail, cartCount, juliana, login, logout, mock, open, summary, theo } from './support'

const items = (page: import('@playwright/test').Page) => page.getByRole('list', { name: 'Itens do carrinho' }).locator('> li')

test.describe('carrinho do visitante', () => {
  test('adicionar, aumentar, diminuir e remover itens @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await expect(items(page)).toHaveCount(1)
    const quantity = page.getByLabel(/Quantidade de Violet Nomad/)
    await expect(quantity).toHaveText('1')
    await expect(page.getByRole('button', { name: /Diminuir quantidade/ })).toBeDisabled()

    await page.getByRole('button', { name: /Aumentar quantidade/ }).click()
    await expect(quantity).toHaveText('2')
    await page.getByRole('button', { name: /Diminuir quantidade/ }).click()
    await expect(quantity).toHaveText('1')

    await page.getByRole('button', { name: /Remover Violet Nomad/ }).first().click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('o limite por edição trava o botão de aumentar @mobile', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await page.getByRole('radio', { name: '1/1', exact: true }).click()
    await page.getByRole('button', { name: /^Comprar/ }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('button', { name: /Aumentar quantidade/ })).toBeDisabled()
  })

  test('o carrinho persiste depois do refresh', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await page.reload()
    await expect(items(page)).toHaveCount(1)
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('2')
  })

  test('os itens do visitante são preservados ao entrar @mobile', async ({ page, isMobile }) => {
    await buyFromDetail(page, 'violet-nomad-314', 3)
    await page.goto('/?auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill(juliana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(juliana.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog).toBeHidden()
    await open(page, '/cart')
    await expect(items(page)).toHaveCount(1)
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('3')
    expect(await page.evaluate(() => localStorage.getItem('kurio.guest-cart'))).toBe('[]')
    expect(await cartCount(page)).toBe(1)
    void isMobile
  })

  test('visitante vê o aviso de cupom e o botão de finalizar leva ao login sem sair do carrinho @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await expect(page.getByText('Entre na sua conta para aplicar um cupom.')).toBeVisible()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page).toHaveURL(/\/cart/)
    expect(page.url()).toContain('redirect=')
  })

  test('carrinho vazio convida a explorar o catálogo', async ({ page }) => {
    await open(page, '/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await page.getByRole('link', { name: 'Explorar NFTs' }).click()
    await expect(page).toHaveURL(/#catalogo/)
  })
})

test.describe('carrinho do usuário', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('itens e quantidades ficam no servidor e sobrevivem ao refresh @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('1')
    await page.getByRole('button', { name: /Aumentar quantidade/ }).click()
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('2')
    await page.reload()
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toHaveText('2')
    expect(await cartCount(page)).toBe(1)
  })

  test('o resumo é coerente: subtotal − desconto + taxa = total', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await expect.poll(async () => (await summary(page))['Total']).toBeGreaterThan(0)
    const values = await summary(page)
    expect(values['Subtotal'] - values['Desconto do lançamento'] + values['Taxa de rede']).toBeCloseTo(values['Total'], 3)
    expect(values['Taxa de rede']).toBeCloseTo(0.016, 3)
  })

  test('o resumo bate com a cotação da API', async ({ page }) => {
    await buyFromDetail(page, 'emerald-ape-042')
    await expect.poll(async () => (await summary(page))['Total']).toBeGreaterThan(0)
    const ui = await summary(page)
    const quote = await page.evaluate(async () => {
      const token = localStorage.getItem('kurio.token') ?? ''
      const cart = await (await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })).json()
      const body = { items: cart.items.map((i: { nftId: string; editionId: string; quantity: number }) => ({ nftId: i.nftId, editionId: i.editionId, quantity: i.quantity })) }
      return (await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()
    })
    expect(ui['Total']).toBeCloseTo(Number(quote.total), 3)
    expect(ui['Subtotal']).toBeCloseTo(Number(quote.subtotal), 3)
  })

  test('cupom inválido mostra o erro no campo @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await page.getByLabel('Código promocional').fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom inválido')).toBeVisible()
    await expect(page.getByLabel('Código promocional')).toHaveAttribute('aria-invalid', 'true')
  })

  test('cupom expirado é recusado com a mensagem certa', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await page.getByLabel('Código promocional').fill('SUMMER25')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Este cupom expirou')).toBeVisible()
  })

  test('campo de cupom vazio pede o código', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Informe o cupom')).toBeVisible()
  })

  test('cupom válido aplica o desconto, persiste no refresh e pode ser removido @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await expect.poll(async () => (await summary(page))['Subtotal']).toBeGreaterThan(0)
    const before = await summary(page)

    await page.getByLabel('Código promocional').fill('welcome10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('WELCOME10')).toBeVisible()
    await expect.poll(async () => (await summary(page))['Desconto do lançamento']).toBeCloseTo(before['Subtotal'] * 0.1, 3)
    expect((await summary(page))['Total']).toBeLessThan(before['Total'])

    await page.reload()
    await expect(page.getByText('WELCOME10')).toBeVisible()

    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(page.getByLabel('Código promocional')).toBeVisible()
    await expect.poll(async () => (await summary(page))['Desconto do lançamento']).toBe(0)
  })

  test('preço alterado depois de adicionar mostra o aviso e aceitar limpa o aviso', async ({ page }) => {
    await buyFromDetail(page, 'emerald-ape-042')
    await mock.patchNft(page, 'emerald-ape-042', { price: '3' })
    await page.reload()
    await expect(page.getByText('O preço de alguns itens mudou desde que você os adicionou.')).toBeVisible()
    await page.getByRole('button', { name: 'Aceitar novos preços' }).click()
    await expect(page.getByText('O preço de alguns itens mudou desde que você os adicionou.')).toBeHidden()
    await page.reload()
    await expect(page.getByText('O preço de alguns itens mudou desde que você os adicionou.')).toBeHidden()
  })

  test('item esgotado bloqueia a finalização e pede para remover', async ({ page }) => {
    await buyFromDetail(page, 'emerald-ape-042')
    const detail = await api<{ editions: { id: string }[] }>(page, '/api/nfts/emerald-ape-042')
    await mock.patchNft(page, 'emerald-ape-042', { stock: Object.fromEntries(detail.editions.map((e) => [e.id, 0])) })
    await page.reload()
    await expect(page.getByText('Esgotado: remova este item para continuar.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
    await page.getByRole('button', { name: /Remover Emerald Ape/ }).first().click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('cada usuário tem o seu próprio carrinho', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314')
    expect(await cartCount(page)).toBe(1)
    await logout(page)
    await login(page, theo)
    await open(page, '/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await logout(page)
    await login(page)
    await open(page, '/cart')
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toBeVisible()
  })
})
