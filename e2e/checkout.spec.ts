import { expect, test, type Page } from '@playwright/test'
import { buyFromDetail, cartCount, checkout, juliana, login, logout, mock, open, orders, summary, theo } from './support'

const confirmed = (page: Page) => page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
const pending = (page: Page) => page.getByRole('heading', { name: 'Aguardando confirmação na rede' })
const refused = (page: Page) => page.getByRole('heading', { name: 'Pagamento recusado' })
const confirmButton = (page: Page) => page.getByRole('button', { name: 'Confirmar compra' })

test.describe('compra completa', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('do catálogo ao recibo confirmado, com o carrinho esvaziado @mobile', async ({ page }) => {
    await open(page, '/')
    await page.locator('#catalogo ul li a[href^="/nft/"]').first().click()
    await expect(page).toHaveURL(/\/nft\//)
    await page.getByRole('button', { name: /^Comprar/ }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await checkout(page)

    await expect(page).toHaveURL(/\/orders\//)
    await expect(confirmed(page)).toBeVisible()
    await expect(page.getByText('ID da transação')).toBeVisible()
    await expect(page.getByText('Detalhes da transação')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no Etherscan' })).toBeVisible()

    await open(page, '/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('o recibo traz itens, taxa e total e sobrevive ao refresh @mobile', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await expect.poll(async () => (await summary(page))['Total']).toBeGreaterThan(0)
    const cart = await summary(page)
    await checkout(page)
    await expect(confirmed(page)).toBeVisible()
    await expect(page.getByText('Violet Nomad #314').first()).toBeVisible()
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await expect(page.getByText(new RegExp(`${cart['Total'].toFixed(3)} ETH`)).first()).toBeVisible()
    await page.reload()
    await expect(confirmed(page)).toBeVisible()
  })

  test('o recibo é um retrato do pedido: mudar o preço depois não altera os valores', async ({ page }) => {
    await buyFromDetail(page, 'emerald-ape-042')
    await checkout(page)
    await expect(confirmed(page)).toBeVisible()
    const before = await page.locator('main').innerText()
    await mock.patchNft(page, 'emerald-ape-042', { price: '9' })
    await page.reload()
    await expect(confirmed(page)).toBeVisible()
    expect(await page.locator('main').innerText()).toBe(before)
  })

  test('com cupom, o desconto aparece no pagamento e no recibo', async ({ page }) => {
    await buyFromDetail(page, 'violet-nomad-314', 2)
    await page.getByLabel('Código promocional').fill('COLLECTOR5')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('COLLECTOR5')).toBeVisible()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
    await expect.poll(async () => (await summary(page))['Desconto do lançamento']).toBeGreaterThan(0)
    const connect = page.getByRole('button', { name: /Conectar na/ })
    if (await connect.count()) await connect.click()
    await expect(page.getByText(/Conectada em/)).toBeVisible()
    await confirmButton(page).click()
    await expect(confirmed(page)).toBeVisible()
    await expect(page.getByText(/Desconto \(COLLECTOR5\)/)).toBeVisible()
  })

  test('o pedido aparece na lista de pedidos do usuário como confirmado', async ({ page }) => {
    await buyFromDetail(page, 'emerald-ape-042')
    await checkout(page)
    await expect(confirmed(page)).toBeVisible()
    const list = await orders(page)
    expect(list).toHaveLength(1)
    expect(list[0].status).toBe('confirmed')
  })

  test('só o dono vê o recibo: outro usuário recebe página não encontrada', async ({ page }) => {
    await buyFromDetail(page, 'emerald-ape-042')
    await checkout(page)
    await expect(confirmed(page)).toBeVisible()
    const id = new URL(page.url()).pathname.split('/').pop()!
    await logout(page)
    await login(page, theo)
    await open(page, `/orders/${id}`)
    await expect(page.getByText('Página não encontrada')).toBeVisible()
  })
})

test.describe('pagamento: validação, carteira e revisão', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
  })

  test('mostra os dados do colecionador, os itens e o resumo para revisar @mobile', async ({ page }) => {
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    for (const name of ['displayName', 'alias', 'profileName', 'address', 'referralCode', 'email', 'ensName']) {
      await expect(page.locator(`input[name=${name}]`).first()).toBeVisible()
    }
    await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible()
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /Observação/ })).toBeEditable()
  })

  test('campos obrigatórios e inválidos mostram erro e impedem o envio @mobile', async ({ page }) => {
    await checkout(page, { confirm: false })
    await page.locator('input[name=displayName]').fill('')
    await page.locator('input[name=address]').fill('abc')
    await page.locator('input[name=email]').fill('sem-arroba')
    await confirmButton(page).click()
    await expect(page.getByText('Use pelo menos 2 caracteres')).toBeVisible()
    await expect(page.getByText('Endereço inválido para esta rede')).toBeVisible()
    await expect(page.locator('input[name=displayName]')).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL(/\/checkout$/)
    expect(await orders(page)).toHaveLength(0)
  })

  test('editar os dados antes de confirmar salva a carteira e conclui a compra @mobile', async ({ page }) => {
    await checkout(page, { confirm: false })
    await page.locator('input[name=displayName]').fill('Juliana Souza')
    await confirmButton(page).click()
    await expect(confirmed(page)).toBeVisible()
    await open(page, '/wallets')
    await expect(page.getByRole('form', { name: 'Carteira principal' }).locator('input[name=displayName]')).toHaveValue('Juliana Souza')
  })

  test('sem conectar a carteira o envio fica bloqueado e conectar libera', async ({ page }) => {
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('button', { name: /Conectar na/ })).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()
    await expect(page.getByText('Conecte a carteira na rede selecionada para enviar o pedido.')).toBeVisible()
    await page.getByRole('button', { name: /Conectar na/ }).click()
    await expect(page.getByText(/Conectada em/)).toBeVisible()
    await expect(confirmButton(page)).toBeEnabled()
  })

  test('desconectar a carteira volta a bloquear o envio', async ({ page }) => {
    await checkout(page, { confirm: false })
    await expect(confirmButton(page)).toBeEnabled()
    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByText(/Desconectada de/)).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()
  })

  test('a carteira recusa a conexão: mostra o erro e mantém o envio bloqueado', async ({ page }) => {
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
    await mock.scenario(page, 'wallet-rejected', ['wallets'])
    await page.getByRole('button', { name: /Conectar na/ }).click()
    await expect(page.getByText('A carteira recusou a conexão.')).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: /Conectar na/ }).click()
    await expect(page.getByText(/Conectada em/)).toBeVisible()
  })

  test('trocar de carteira e de tipo de carteira funciona', async ({ page }) => {
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('radio', { name: /Reserva/ })).toBeVisible()
    await page.getByRole('radio', { name: /Reserva/ }).click()
    await expect(page.getByRole('radio', { name: /Reserva/ })).toHaveAttribute('aria-checked', 'true')
    await page.getByLabel('Coinbase Wallet').check({ force: true })
    await expect(page.getByLabel('Coinbase Wallet')).toBeChecked()
    await page.getByLabel('MetaMask').check({ force: true })
    await expect(page.getByLabel('MetaMask')).toBeChecked()
  })

  test('quem não tem carteira é levado a cadastrar antes de comprar', async ({ page }) => {
    const other = await page.context().browser()!.newContext()
    const second = await other.newPage()
    await login(second, theo)
    await buyFromDetail(second, 'emerald-ape-042')
    await second.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(second.getByText('Você ainda não cadastrou carteiras.')).toBeVisible()
    await expect(second.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
    await second.getByRole('link', { name: 'Cadastrar carteira' }).click()
    await expect(second).toHaveURL(/\/wallets$/)
    await other.close()
  })

  test('o pagamento sem itens no carrinho oferece voltar ao catálogo', async ({ page }) => {
    await page.getByRole('button', { name: /Remover Violet Nomad/ }).first().click()
    await open(page, '/checkout')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('refresh no pagamento mantém o carrinho', async ({ page }) => {
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible()
    await expect(page.getByText('Violet Nomad #314').first()).toBeVisible()
  })
})

test.describe('falhas na compra', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
  })

  test('pagamento recusado: mostra a recusa e preserva os itens do carrinho', async ({ page }) => {
    await mock.scenario(page, 'payment-refused', ['orders'])
    await checkout(page)
    await expect(page).toHaveURL(/\/orders\//)
    await expect(refused(page)).toBeVisible()
    await expect(confirmed(page)).toBeHidden()
    expect(await cartCount(page)).toBe(1)
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByLabel(/Quantidade de Violet Nomad/)).toBeVisible()
  })

  test('recusado é terminal: depois do refresh continua recusado', async ({ page }) => {
    await mock.scenario(page, 'payment-refused', ['orders'])
    await checkout(page)
    await expect(refused(page)).toBeVisible()
    await page.reload()
    await expect(refused(page)).toBeVisible()
    await expect(confirmed(page)).toBeHidden()
  })

  test('clique repetido cria um único pedido', async ({ page }) => {
    await checkout(page, { confirm: false })
    await confirmButton(page).dblclick()
    await expect(confirmed(page)).toBeVisible()
    expect(await orders(page)).toHaveLength(1)
  })

  test('vários cliques rápidos seguidos ainda cabem em um só pedido', async ({ page }) => {
    await checkout(page, { confirm: false })
    const button = confirmButton(page)
    await Promise.allSettled([button.click({ timeout: 2000 }), button.click({ timeout: 2000 }), button.click({ timeout: 2000 })])
    await expect(confirmed(page)).toBeVisible()
    expect(await orders(page)).toHaveLength(1)
  })

  test('timeout depois de criar o pedido: reenviar recupera o mesmo pedido, sem duplicar', async ({ page }) => {
    test.setTimeout(90_000)
    await mock.scenario(page, 'order-timeout', ['orders'])
    await checkout(page)
    await expect(page.getByText('A conexão demorou. Confirme de novo: o pedido não será duplicado.')).toBeVisible({ timeout: 20_000 })
    await expect(page).toHaveURL(/\/checkout$/)

    await confirmButton(page).click()
    await expect(page).toHaveURL(/\/orders\//, { timeout: 20_000 })
    await expect(confirmed(page)).toBeVisible()
    const list = await orders(page)
    expect(list).toHaveLength(1)
    expect(new URL(page.url()).pathname.endsWith(list[0].id)).toBe(true)
  })

  test('preço muda durante a compra: avisa, exige nova confirmação e fecha com o valor novo', async ({ page }) => {
    await checkout(page, { confirm: false })
    await mock.scenario(page, 'price-changed', ['orders'])
    await confirmButton(page).click()
    await expect(page.getByText('Os valores ou a disponibilidade mudaram. Revise o total e confirme novamente.')).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
    expect(await orders(page)).toHaveLength(0)

    // sem aceitar os novos valores o envio continua bloqueado
    await expect(confirmButton(page)).toBeDisabled()
    await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(confirmButton(page)).toBeEnabled()
    await confirmButton(page).click()
    await expect(confirmed(page)).toBeVisible()
    expect(await orders(page)).toHaveLength(1)
  })

  test('edição esgota durante a compra: bloqueia o envio e preserva o carrinho', async ({ page }) => {
    await checkout(page, { confirm: false })
    await mock.scenario(page, 'sold-out', ['orders'])
    await confirmButton(page).click()
    await expect(page.getByText(/não estão mais disponíveis|mudaram/).first()).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
    expect(await orders(page)).toHaveLength(0)
    expect(await cartCount(page)).toBe(1)
  })

  test('erro 500 ao enviar: mostra o erro, preserva o carrinho e a nova tentativa funciona', async ({ page }) => {
    await checkout(page, { confirm: false })
    await mock.scenario(page, 'server-error', ['orders'])
    await confirmButton(page).click()
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
    expect(await cartCount(page)).toBe(1)

    await mock.scenario(page, 'default')
    await confirmButton(page).click()
    await expect(confirmed(page)).toBeVisible()
    expect(await orders(page)).toHaveLength(1)
  })

  test('sem conexão ao enviar: erro, itens preservados e retomada depois', async ({ page }) => {
    await checkout(page, { confirm: false })
    await mock.scenario(page, 'offline', ['orders'])
    await confirmButton(page).click()
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible()
    expect(await cartCount(page)).toBe(1)
    await mock.scenario(page, 'default')
    await confirmButton(page).click()
    await expect(confirmed(page)).toBeVisible()
  })

  test('a sessão expira ao confirmar: login com aviso e retorno ao pagamento com o carrinho intacto', async ({ page }) => {
    await checkout(page, { confirm: false })
    await mock.scenario(page, 'session-expired', ['orders'])
    await confirmButton(page).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Sua sessão expirou')).toBeVisible()

    await mock.scenario(page, 'default')
    await dialog.getByLabel('E-mail').fill(juliana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(juliana.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout(\?|$)/)
    await expect(page.getByText('Violet Nomad #314').first()).toBeVisible()
    expect(await cartCount(page)).toBe(1)
  })
})

test.describe('pedido pendente', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
  })

  test('fica pendente, sobrevive ao refresh e o servidor confirma pelo socket', async ({ page }) => {
    await mock.scenario(page, 'manual-settlement', ['orders'])
    await checkout(page)
    await expect(pending(page)).toBeVisible()
    await expect(confirmed(page)).toBeHidden()

    await page.reload()
    await expect(pending(page)).toBeVisible()

    const id = new URL(page.url()).pathname.split('/').pop()!
    await mock.settle(page, id, 'confirmed')
    await expect(confirmed(page)).toBeVisible()
    expect(await orders(page)).toHaveLength(1)
  })

  test('pendente que o servidor recusa mostra a recusa', async ({ page }) => {
    await mock.scenario(page, 'manual-settlement', ['orders'])
    await checkout(page)
    await expect(pending(page)).toBeVisible()
    const id = new URL(page.url()).pathname.split('/').pop()!
    await mock.settle(page, id, 'refused')
    await expect(refused(page)).toBeVisible()
  })

  test('a confirmação só aparece para pedido confirmado, nunca para pendente', async ({ page }) => {
    await mock.scenario(page, 'manual-settlement', ['orders'])
    await checkout(page)
    await expect(pending(page)).toBeVisible()
    await page.waitForTimeout(3000)
    await expect(confirmed(page)).toBeHidden()
  })

  test('queda do socket com o pedido pendente: ao reconectar o estado é recuperado sem nova compra', async ({ page }) => {
    await mock.scenario(page, 'manual-settlement', ['orders'])
    await checkout(page)
    await expect(pending(page)).toBeVisible()
    const id = new URL(page.url()).pathname.split('/').pop()!

    await mock.disconnect(page)
    await mock.settle(page, id, 'confirmed')
    await expect(confirmed(page)).toBeVisible({ timeout: 15_000 })
    expect(await orders(page)).toHaveLength(1)
  })
})
