import { expect, test } from '@playwright/test'
import { login, logout, mock, open, theo } from './support'

const profileForm = (page: import('@playwright/test').Page) => page.getByRole('form', { name: 'Dados do perfil' })
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

test.describe('perfil do colecionador', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await open(page, '/profile')
    await expect(profileForm(page)).toBeVisible()
  })

  test('vem preenchido e o botão salvar só habilita depois de uma alteração @mobile', async ({ page }) => {
    await expect(profileForm(page).locator('input[name=username]')).toHaveValue('juliana')
    await expect(profileForm(page).getByRole('button', { name: 'Salvar' })).toBeDisabled()
    await profileForm(page).locator('input[name=displayName]').fill('Juliana Souza')
    await expect(profileForm(page).getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  test('campos inválidos mostram erro associado ao campo e não salvam @mobile', async ({ page }) => {
    const form = profileForm(page)
    await form.locator('input[name=displayName]').fill('J')
    await form.locator('input[name=email]').fill('sem-arroba')
    await form.locator('input[name=ensName]').fill('ab')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(form.getByText('Use pelo menos 2 caracteres')).toBeVisible()
    await expect(form.locator('input[name=displayName]')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByText(/3 a 32 letras/)).toBeVisible()
    await page.reload()
    await expect(profileForm(page).locator('input[name=displayName]')).toHaveValue('Juliana Costa')
  })

  test('alterações confirmadas permanecem depois do refresh @mobile', async ({ page }) => {
    const form = profileForm(page)
    await form.locator('input[name=displayName]').fill('Juliana Souza')
    await form.locator('input[name=walletNickname]').fill('Minha carteira')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil atualizado')).toBeVisible()
    await page.reload()
    await expect(profileForm(page).locator('input[name=displayName]')).toHaveValue('Juliana Souza')
    await expect(profileForm(page).locator('input[name=walletNickname]')).toHaveValue('Minha carteira')
  })

  test('nome de usuário já usado por outra pessoa é recusado pela API', async ({ page }) => {
    const form = profileForm(page)
    await form.locator('input[name=username]').fill('theo')
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(form.locator('input[name=username]')).toHaveAttribute('aria-invalid', 'true')
  })

  test('e-mail já usado por outra pessoa é recusado pela API', async ({ page }) => {
    const form = profileForm(page)
    await form.locator('input[name=email]').fill(theo.email)
    await form.getByRole('button', { name: 'Salvar' }).click()
    await expect(form.locator('input[name=email]')).toHaveAttribute('aria-invalid', 'true')
  })

  test('avatar: formato inválido, envio, persistência e remoção @mobile', async ({ page }) => {
    await page.getByLabel('Escolher imagem do avatar').setInputFiles({ name: 'a.gif', mimeType: 'image/gif', buffer: png })
    await expect(page.getByText(/Formato não aceito/)).toBeVisible()

    await page.getByLabel('Escolher imagem do avatar').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: png })
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeHidden()
  })

  test('avatar acima de 500 KB é recusado', async ({ page }) => {
    const big = Buffer.alloc(600 * 1024, 1)
    await page.getByLabel('Escolher imagem do avatar').setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: big })
    await expect(page.getByText(/muito grande/)).toBeVisible()
  })

  test('senha: confirmação diferente, senha atual errada e senha fraca @mobile', async ({ page }) => {
    const form = page.getByRole('form', { name: 'Alterar senha' })
    await form.getByLabel('Senha atual').fill('errada')
    await form.getByLabel('Nova senha', { exact: true }).fill('Novissima@2026')
    await form.getByLabel('Confirmar nova senha').fill('diferente')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(form.getByText('As senhas não conferem')).toBeVisible()

    await form.getByLabel('Confirmar nova senha').fill('Novissima@2026')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(form.getByRole('alert')).toBeVisible()

    await form.getByLabel('Nova senha', { exact: true }).fill('curta')
    await form.getByLabel('Confirmar nova senha').fill('curta')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(form.getByText('Use pelo menos 8 caracteres')).toBeVisible()
  })

  test('senha alterada vale no próximo login e a antiga deixa de valer', async ({ page }) => {
    const form = page.getByRole('form', { name: 'Alterar senha' })
    await form.getByLabel('Senha atual').fill('Kurio@2026')
    await form.getByLabel('Nova senha', { exact: true }).fill('Novissima@2026')
    await form.getByLabel('Confirmar nova senha').fill('Novissima@2026')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada')).toBeVisible()

    await logout(page)
    await open(page, '/?auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill('juliana@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog.getByText('E-mail ou senha incorretos.')).toBeVisible()

    await dialog.getByLabel('Senha', { exact: true }).fill('Novissima@2026')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog).toBeHidden()
  })

  test('o menu leva às outras telas da conta e o voltar do mobile vai para a home @mobile', async ({ page, isMobile }) => {
    const menu = page.getByRole('navigation', { name: 'Minha conta' })
    await menu.getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/wallets$/)
    await page.getByRole('navigation', { name: 'Minha conta' }).getByRole('link', { name: 'Lista de interesse' }).click()
    await expect(page).toHaveURL(/\/favorites$/)
    await page.getByRole('navigation', { name: 'Minha conta' }).getByRole('button', { name: 'Atividade' }).click()
    await expect(page.getByText('Esta função não faz parte desta demonstração.')).toBeVisible()
    if (isMobile) {
      await page.getByRole('button', { name: 'Voltar' }).click()
      await expect(page).toHaveURL(/\/$/)
    }
  })

  test('sair em uma tela da conta volta para a home @mobile', async ({ page }) => {
    await logout(page)
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('carteiras', () => {
  const principal = (page: import('@playwright/test').Page) => page.getByRole('form', { name: 'Carteira principal' })
  const secundaria = (page: import('@playwright/test').Page) => page.getByRole('form', { name: 'Carteira secundária' })

  test('lista as duas carteiras com os dados preenchidos @mobile', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    await expect(principal(page).locator('input[name=alias]')).not.toHaveValue('')
    await expect(secundaria(page).locator('input[name=alias]')).toHaveValue('Reserva')
    await expect(page.getByRole('form')).toHaveCount(2)
  })

  test('endereço inválido para a rede mostra erro e não salva @mobile', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    await principal(page).locator('input[name=address]').fill('abc')
    await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Endereço inválido para esta rede')).toBeVisible()
  })

  test('mudar a rede para Solana exige endereço no formato Solana', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    await principal(page).locator('select[name=network]').selectOption('solana')
    await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Endereço inválido para esta rede')).toBeVisible()
  })

  test('endereço já cadastrado em outra carteira é conflito mostrado no campo', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    const other = await secundaria(page).locator('input[name=address]').inputValue()
    await principal(page).locator('input[name=address]').fill(other)
    await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(principal(page).locator('input[name=address]')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Este endereço já está cadastrado').first()).toBeVisible()
  })

  test('editar e salvar persiste depois do refresh @mobile', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    await principal(page).locator('input[name=alias]').fill('Principal editada')
    await principal(page).locator('input[name=referralCode]').fill('NOVO2026')
    await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva')).toBeVisible()
    await page.reload()
    await expect(principal(page).locator('input[name=alias]')).toHaveValue('Principal editada')
    await expect(principal(page).locator('input[name=referralCode]')).toHaveValue('NOVO2026')
  })

  test('o sufixo do nome ENS é escolhido, guardado e mostrado de volta', async ({ page }) => {
    await login(page)
    await open(page, '/wallets')
    await expect(principal(page).locator('select[name=ensSuffix] option')).toHaveText(['.eth', '.btc', '.sol', '.crypto', '.bnb'])
    await principal(page).locator('select[name=ensSuffix]').selectOption('crypto')
    await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva')).toBeVisible()
    await page.reload()
    await expect(principal(page).locator('select[name=ensSuffix]')).toHaveValue('crypto')
  })

  test('quem não tem carteira cadastra a principal e a secundária copiando os dados', async ({ page }) => {
    await login(page, theo)
    await open(page, '/wallets')
    await expect(page.getByText('Você ainda não adicionou uma carteira principal.')).toBeVisible()

    await page.getByRole('button', { name: 'Adicionar' }).first().click()
    const form = principal(page)
    await form.locator('input[name=displayName]').fill('Theo Marlowe')
    await form.locator('input[name=alias]').fill('Principal Theo')
    await form.locator('select[name=network]').selectOption('ethereum')
    await form.locator('input[name=profileName]').fill('theo')
    await form.locator('input[name=address]').fill('0x' + '1a2b3c4d5e'.repeat(4))
    await form.locator('select[name=provider]').selectOption('metamask')
    await form.locator('input[name=referralCode]').fill('THEO01')
    await form.locator('input[name=email]').fill('theo@kurio.dev')
    await form.locator('input[name=ensName]').fill('theo-ens')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva')).toBeVisible()

    await page.getByLabel('Igual à carteira principal').check()
    await expect(secundaria(page).locator('input[name=profileName]')).toHaveValue('theo')
    await expect(secundaria(page).locator('input[name=address]')).toHaveValue('')
    await secundaria(page).locator('input[name=address]').fill('0x' + '9f8e7d6c5b'.repeat(4))
    await secundaria(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva')).toBeVisible()
  })

  test('formulário vazio de carteira nova mostra os erros obrigatórios', async ({ page }) => {
    await login(page, theo)
    await open(page, '/wallets')
    await page.getByRole('button', { name: 'Adicionar' }).first().click()
    await principal(page).getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(principal(page).locator('input[name=displayName]')).toHaveAttribute('aria-invalid', 'true')
    await expect(principal(page).locator('input[name=address]')).toHaveAttribute('aria-invalid', 'true')
  })

  test('falha de servidor ao carregar carteiras mostra o erro e permite tentar de novo', async ({ page }) => {
    await login(page)
    await open(page, '/')
    await mock.scenario(page, 'server-error', ['wallets'])
    await open(page, '/wallets')
    await expect(page.getByText('Não foi possível carregar as carteiras.')).toBeVisible()
    await mock.scenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(principal(page)).toBeVisible()
  })
})
