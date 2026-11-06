import { defineConfig } from '@playwright/test'

const PORT = 5199

// desktop roda tudo; o projeto mobile roda os testes marcados com @mobile (fluxos que existem nos dois layouts)
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' } },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // uma nova tentativa absorve oscilações de carga quando os quatro workers disputam o mesmo dev server
  retries: 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      grep: /@mobile/,
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
