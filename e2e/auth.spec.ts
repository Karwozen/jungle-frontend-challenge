import { expect, test } from '@playwright/test'
import { buyFromDetail, cartCount, juliana, login, logout, mock, open, theo } from './support'

test.describe('cadastro', () => {
  test('envio vazio mostra erros nos campos, associados por aria-describedby @mobile', async ({ page }) => {
    await open(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(dialog.getByText('Use pelo menos 3 caracteres')).toBeVisible()
    const username = dialog.getByLabel('Nome de usuário')
    await expect(username).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await username.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${describedby(describedBy)}"]`)).toContainText('Use pelo menos 3 caracteres')
  })

  test('senha fraca e confirmação diferente são recusadas', async ({ page }) => {
    await open(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('novousuario')
    await dialog.getByLabel('E-mail').fill('novo@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('curta')
    await dialog.getByLabel('Confirmar senha').fill('outra')
    await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(dialog.getByText('Use pelo menos 8 caracteres')).toBeVisible()
    await expect(dialog.getByText('As senhas não conferem')).toBeVisible()
  })

  test('e-mail já cadastrado mostra o conflito no campo', async ({ page }) => {
    await open(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('outrojuliana')
    await dialog.getByLabel('E-mail').fill(juliana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await dialog.getByLabel('Confirmar senha').fill('Kurio@2026')
    await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(dialog.getByText(/já (está|foi)|cadastrad/i).first()).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  test('nome de usuário já usado também é conflito', async ({ page }) => {
    await open(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('juliana')
    await dialog.getByLabel('E-mail').fill('diferente@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await dialog.getByLabel('Confirmar senha').fill('Kurio@2026')
    await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(dialog.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  test('cadastro válido cria a conta, entra e permite voltar a entrar depois @mobile', async ({ page }) => {
    await open(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('colecionadora')
    await dialog.getByLabel('E-mail').fill('colecionadora@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Senha@2026')
    await dialog.getByLabel('Confirmar senha').fill('Senha@2026')
    await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
    await expect(dialog).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem('kurio.token'))).toBeTruthy()

    await logout(page)
    expect(await page.evaluate(() => localStorage.getItem('kurio.token'))).toBeNull()

    await open(page, '/?auth=login')
    const login = page.getByRole('dialog')
    await login.getByLabel('E-mail').fill('colecionadora@kurio.dev')
    await login.getByLabel('Senha', { exact: true }).fill('Senha@2026')
    await login.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(login).toBeHidden()
  })
})

test.describe('login e sessão', () => {
  test('envio vazio mostra erros de validação @mobile', async ({ page }) => {
    await open(page, '/?auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog.getByText('Digite um e-mail válido')).toBeVisible()
    await expect(dialog.getByText('Digite sua senha')).toBeVisible()
  })

  test('credencial errada mostra o erro da API sem sair do diálogo @mobile', async ({ page }) => {
    await open(page, '/?auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill(juliana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('errada123')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('login social com Google ou Facebook inicia a sessão e fecha o diálogo @mobile', async ({ page }) => {
    await open(page, '/?auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Continuar com Google' }).click()
    await expect(dialog).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem('kurio.token'))).toBeTruthy()
  })

  test('login válido fecha o diálogo e mostra o usuário', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('button', { name: /juliana/ })).toBeVisible()
  })

  test('a sessão sobrevive ao refresh e nenhuma senha fica guardada em claro', async ({ page }) => {
    await login(page)
    await page.reload()
    await expect(page.getByRole('button', { name: /juliana/ })).toBeVisible()
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
    expect(stored).not.toContain('Kurio@2026')
  })

  test('rota privada sem sessão abre o login e depois do login volta ao destino @mobile', async ({ page }) => {
    await open(page, '/wallets')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(page.url()).toContain('redirect=')
    await dialog.getByLabel('E-mail').fill(juliana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(juliana.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/wallets(\?|$)/)
    await expect(page.getByRole('form', { name: 'Carteira principal' })).toBeVisible()
  })

  for (const route of ['/checkout', '/profile', '/favorites', '/orders/ord_qualquer']) {
    test(`${route} exige autenticação`, async ({ page }) => {
      await open(page, route)
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(page.url()).toContain('auth=login')
    })
  }

  test('logout limpa o token e os dados privados', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'emerald-ape-042')
    await logout(page)
    expect(await page.evaluate(() => localStorage.getItem('kurio.token'))).toBeNull()
    await open(page, '/profile')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('troca de usuário não herda carrinho nem favoritos do anterior', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
    expect(await cartCount(page)).toBeGreaterThan(0)
    await logout(page)

    await login(page, theo)
    await open(page, '/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await open(page, '/favorites')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  })

  test('sessão expirada durante a navegação abre o login com aviso e retoma o destino', async ({ page }) => {
    await login(page)
    await open(page, '/')
    await mock.scenario(page, 'session-expired', ['wallets'])
    await open(page, '/wallets')
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('kurio.token'))).toBeNull()

    await mock.scenario(page, 'default')
    await dialog.getByLabel('E-mail').fill(juliana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(juliana.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/wallets(\?|$)/)
    await expect(page.getByRole('form', { name: 'Carteira principal' })).toBeVisible()
  })

  test('sessão que expira no servidor derruba o acesso na próxima requisição privada', async ({ page }) => {
    await login(page)
    await open(page, '/profile')
    await expect(page.getByRole('form', { name: 'Dados do perfil' })).toBeVisible()
    await mock.scenario(page, 'session-expired', ['profile'])
    await page.getByRole('form', { name: 'Dados do perfil' }).locator('input[name=displayName]').fill('Juliana Alterada')
    await page.getByRole('form', { name: 'Dados do perfil' }).getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('dialog').getByText('Sua sessão expirou')).toBeVisible()
  })
})

// o aria-describedby pode listar vários ids; o teste só precisa do primeiro
function describedby(value: string | null) {
  return value?.split(' ')[0] ?? ''
}
