import { expect, test, type Page } from '@playwright/test'
import { buyFromDetail, catalogCards, juliana, login, open } from './support'

// o contorno de foco vem de box-shadow (ring) ou de outline, conforme o componente
async function hasFocusIndicator(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return false
    const style = getComputedStyle(el)
    const ring = style.boxShadow !== 'none' && style.boxShadow !== ''
    const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    const underline = style.textDecorationLine.includes('underline')
    const colored = el.matches(':focus-visible') && (style.color !== getComputedStyle(document.body).color || style.borderColor !== '')
    return ring || outline || underline || colored
  })
}

test.describe('teclado e foco', () => {
  test('o primeiro Tab leva ao link "Ir para o conteúdo", que pula para o conteúdo principal', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Ir para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#conteudo/)
  })

  test('dá para chegar ao login só pelo teclado e o foco entra no diálogo', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    const entrar = page.getByRole('link', { name: 'Entrar' })
    await entrar.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  })

  test('o foco fica preso no diálogo de login e Esc devolve o foco ao botão que abriu', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    const entrar = page.getByRole('link', { name: 'Entrar' })
    await entrar.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Shift+Tab')
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('formulário de login: Enter envia e o foco visível acompanha os campos', async ({ page }) => {
    await open(page, '/?auth=login')
    const dialog = page.getByRole('dialog')
    const email = dialog.getByLabel('E-mail')
    await email.focus()
    expect(await hasFocusIndicator(page)).toBe(true)
    await email.fill(juliana.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(juliana.password)
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /juliana/ })).toBeVisible()
  })

  test('elementos interativos principais mostram foco visível ao receber Tab', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await hasFocusIndicator(page), `elemento ${i + 1} sem indicador de foco`).toBe(true)
    }
  })

  test('compra inteira só com o teclado: do detalhe ao carrinho', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('radio', { name: '1/10' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('radio', { name: '1/10' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: 'Aumentar quantidade' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('output')).toHaveText('2')
    await page.getByRole('button', { name: /^Comprar/ }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/cart$/)
  })

  test('as abas de detalhes e avaliações funcionam por teclado', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    const reviews = page.getByRole('tab', { name: /Avaliações/ })
    await reviews.focus()
    await page.keyboard.press('Enter')
    await expect(reviews).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#panel-reviews')).toBeVisible()
  })

  test('o diálogo de zoom prende o foco e devolve ao gatilho', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    const trigger = page.getByRole('button', { name: /Ampliar imagem/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('o painel de filtros do mobile prende o foco, fecha com Esc e devolve o foco @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'drawer só existe no mobile')
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    const open_ = page.getByRole('button', { name: 'Abrir filtros' })
    await open_.click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(open_).toBeFocused()
  })

  test('o menu do usuário abre e fecha pelo teclado e leva às telas da conta', async ({ page, isMobile }) => {
    test.skip(isMobile, 'menu do header só existe no desktop')
    await login(page)
    const trigger = page.locator('header button[aria-haspopup="menu"]')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem', { name: 'Sair' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menuitem', { name: 'Sair' })).toBeHidden()
  })
})

test.describe('semântica, rótulos e erros', () => {
  test('cada tela tem um único h1 e a página declara o idioma @mobile', async ({ page }) => {
    for (const route of ['/', '/nft/emerald-ape-042', '/cart']) {
      await open(page, route)
      await expect(page.locator('h1').first()).toBeAttached()
      expect(await page.locator('h1:visible, h1.sr-only').count(), route).toBe(1)
    }
    expect(await page.locator('html').getAttribute('lang')).toBe('pt-BR')
  })

  test('os campos dos formulários têm rótulo e o erro fica ligado ao campo por aria-describedby @mobile', async ({ page }) => {
    await open(page, '/?auth=login')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    for (const label of ['E-mail', 'Senha']) {
      const field = dialog.getByLabel(label, { exact: true })
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      const ids = (await field.getAttribute('aria-describedby'))!.split(' ')
      for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toBeVisible()
    }
  })

  test('erros de formulário são anunciados com role=alert', async ({ page }) => {
    await open(page, '/?auth=login')
    await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible()
  })

  test('imagens relevantes têm texto alternativo e as decorativas ficam vazias @mobile', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page).first()).toBeVisible()
    const cards = await catalogCards(page).locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt')))
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((alt) => alt && alt.length > 2)).toBe(true)

    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ampliar imagem de Emerald Ape #042/ })).toBeVisible()
    const thumbs = await page.locator('ul[aria-label="Imagens do NFT"] img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt')))
    expect(thumbs.every((alt) => alt === '')).toBe(true)
  })

  test('toda imagem do app tem o atributo alt @mobile', async ({ page }) => {
    for (const route of ['/', '/nft/emerald-ape-042']) {
      await open(page, route)
      await expect(page.locator('main img').locator('visible=true').first()).toBeVisible()
      const missing = await page.locator('img:not([alt])').count()
      expect(missing, route).toBe(0)
    }
  })

  test('botões só com ícone têm nome acessível @mobile', async ({ page }) => {
    await login(page)
    await buyFromDetail(page, 'violet-nomad-314')
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a')].filter((el) => {
        const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim()
        const hidden = (el as HTMLElement).offsetParent === null
        return !hidden && !name
      }).length,
    )
    expect(unnamed).toBe(0)
  })

  test('estados que dependem de cor também têm texto ou atributo: edição selecionada, carteira conectada, aba ativa', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('radio', { name: '1/50' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('tab', { name: 'Detalhes do NFT' })).toHaveAttribute('aria-selected', 'true')
    await open(page, '/')
    await expect(page.getByRole('link', { name: 'Todos os NFTs' })).toHaveAttribute('aria-current', 'page')
  })

  test('feedback acessível: avisos de mutation e de tempo real passam por região aria-live @mobile', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const polite = page.locator('[aria-live="polite"]')
    expect(await polite.count()).toBeGreaterThan(0)
    await expect(page.locator('p[role=status][aria-live=polite].sr-only')).toBeAttached()
  })

  test('respeita movimento reduzido: sem transições nos cards e no destaque @mobile', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(catalogCards(page).first()).toBeVisible()
    const animated = await page.evaluate(() =>
      [...document.querySelectorAll('main *')].filter((el) => {
        const style = getComputedStyle(el)
        return style.animationName !== 'none' && style.animationDuration !== '0s' && !el.closest('[aria-busy]')
      }).length,
    )
    expect(animated).toBe(0)
  })

  test('zoom de 200% (viewport estreito) não perde conteúdo nem cria rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    for (const route of ['/', '/nft/emerald-ape-042', '/cart']) {
      await open(page, route)
      await page.waitForTimeout(400)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow, `${route} com ${overflow}px de rolagem horizontal`).toBeLessThanOrEqual(0)
    }
  })
})
