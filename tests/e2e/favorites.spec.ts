import { expect, test } from '@playwright/test'

async function login(page: import('@playwright/test').Page, email = 'alice@kurio.test') {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('Kurio2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/nfts\/emerald-ape-42/)
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeEnabled()
}

test('favoritos exigem conta, persistem e são isolados por usuário', async ({ page, isMobile }) => {
  await login(page)
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()
  if (isMobile) await page.getByRole('link', { name: 'Voltar ao mercado' }).click()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/?(?:\?.*)?$/)
  await login(page, 'bruno@kurio.test')
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()
})

test('falha de favorito reverte a atualização otimista e informa o erro', async ({ page }) => {
  await login(page)
  await page.evaluate(async () => { await fetch('/api/demo/favorites-fail-next', { method: 'POST' }) })
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar')
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeVisible()
})
