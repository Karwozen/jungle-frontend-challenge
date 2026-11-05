import { test, expect } from '@playwright/test'
test('REST e Socket.IO compartilham estado persistente', async ({ page }) => {
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') console.log(message.text()) })
  page.on('pageerror', error => console.log(error.message))
  await page.goto('/demo/foundation')
  await expect(page.getByRole('status')).toHaveText('Socket.IO: conectado')
  await expect(page.getByTestId('price-emerald-ape-42')).toHaveText('1.25 ETH')
  await page.getByRole('button', { name: 'Simular alteração de preço' }).click()
  await expect(page.getByTestId('last-event')).toContainText('versão 2')
  await expect(page.getByTestId('price-emerald-ape-42')).toHaveText('1.3 ETH')
  await page.reload()
  await expect(page.getByTestId('price-emerald-ape-42')).toHaveText('1.3 ETH')
})
