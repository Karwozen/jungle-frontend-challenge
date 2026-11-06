// Auditoria do Lighthouse: início e detalhe do NFT, perfis mobile e desktop, três medições cada, mediana por categoria.
// Roda contra o build otimizado (vite preview) com os mocks ligados, sem atalhos que só melhorem a nota.
//   npm run lighthouse            -> gera o build, audita e escreve lighthouse/RESULTS.md
//   RUNS=1 npm run lighthouse:run -> uma medição só (teste rápido)
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'lighthouse')
const reportsDir = path.join(outDir, 'reports')
const PORT = 4173
const RUNS = Number(process.env.RUNS ?? 3)

const pages = [
  { name: 'inicio', path: '/' },
  { name: 'detalhe', path: '/nft/emerald-ape-042' },
]
const profiles = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]
const categories = ['performance', 'accessibility', 'best-practices', 'seo']
const targets = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // o servidor ainda está subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`o preview não respondeu em ${url}`)
}

await mkdir(reportsDir, { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, shell: true, stdio: 'ignore' })
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath()
const results = []
let userAgent = ''
let lighthouseVersion = ''

try {
  await waitForServer(`http://localhost:${PORT}/`)

  for (const profile of profiles) {
    for (const page of pages) {
      const runs = []
      for (let run = 1; run <= RUNS; run++) {
        // um Chrome novo por medição: perfil limpo, sem cache nem service worker da rodada anterior
        const chrome = await chromeLauncher.launch({
          chromePath,
          chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
        })
        try {
          const { lhr, report } = await lighthouse(
            `http://localhost:${PORT}${page.path}`,
            { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: categories },
            profile.config,
          )
          userAgent = lhr.environment.hostUserAgent
          lighthouseVersion = lhr.lighthouseVersion
          const base = path.join(reportsDir, `${page.name}-${profile.name}-${run}`)
          await writeFile(`${base}.json`, report[0])
          await writeFile(`${base}.html`, report[1])
          runs.push({
            scores: Object.fromEntries(categories.map((id) => [id, Math.round((lhr.categories[id].score ?? 0) * 100)])),
            lcp: lhr.audits['largest-contentful-paint'].numericValue,
            cls: lhr.audits['cumulative-layout-shift'].numericValue,
            tbt: lhr.audits['total-blocking-time'].numericValue,
            fcp: lhr.audits['first-contentful-paint'].numericValue,
          })
          console.log(`${profile.name} ${page.name} #${run}`, JSON.stringify(runs.at(-1).scores))
        } finally {
          await chrome.kill()
        }
      }
      results.push({
        page: page.name,
        profile: profile.name,
        scores: Object.fromEntries(categories.map((id) => [id, median(runs.map((r) => r.scores[id]))])),
        lcp: median(runs.map((r) => r.lcp)),
        cls: median(runs.map((r) => r.cls)),
        tbt: median(runs.map((r) => r.tbt)),
        fcp: median(runs.map((r) => r.fcp)),
        runs,
      })
    }
  }
} finally {
  server.kill()
  spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], { shell: true, stdio: 'ignore' })
}

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const environment = {
  date: new Date().toISOString(),
  lighthouse: lighthouseVersion,
  chrome: userAgent.match(/Chrome\/[\d.]+/)?.[0] ?? userAgent,
  node: process.version,
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  cpu: `${os.cpus()[0]?.model.trim()} × ${os.cpus().length}`,
  memoryGb: Math.round(os.totalmem() / 1024 ** 3),
  app: `${pkg.name}@${pkg.version} (build de produção, vite preview, mocks ligados)`,
  runs: RUNS,
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify({ environment, targets, results }, null, 2))

const ms = (value) => `${Math.round(value)} ms`
const mark = (id, score) => (score >= targets[id] ? '✅' : '⚠️')
const rows = results
  .map(
    (r) =>
      `| ${r.page} | ${r.profile} | ${categories.map((id) => `${r.scores[id]} ${mark(id, r.scores[id])}`).join(' | ')} | ${ms(r.lcp)} | ${r.cls.toFixed(3)} | ${ms(r.tbt)} |`,
  )
  .join('\n')

await writeFile(
  path.join(outDir, 'RESULTS.md'),
  `# Auditoria Lighthouse

Mediana de ${RUNS} medições por página e perfil. Relatórios completos em \`lighthouse/reports/\` (HTML e JSON de cada medição).

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
${rows}

Metas: Performance ≥ ${targets.performance}, Accessibility ≥ ${targets.accessibility}, Best Practices ≥ ${targets['best-practices']}, SEO ≥ ${targets.seo}.

## Ambiente e condições

- Data: ${environment.date}
- Lighthouse ${environment.lighthouse}, ${environment.chrome}, Node ${environment.node}
- Sistema: ${environment.os}; CPU: ${environment.cpu}; memória: ${environment.memoryGb} GB
- Aplicação: ${environment.app}
- Perfis: mobile (configuração padrão do Lighthouse: Moto G Power emulado, 4G simulado, CPU 4× mais lenta) e desktop (preset \`desktop\`)
- Cenário dos mocks: padrão (\`default\`), com latência simulada de 90 a 200 ms por requisição da API
- Um Chrome novo por medição, sem cache nem service worker da rodada anterior
- Imagens, fontes e funcionalidades da entrega carregadas normalmente; nenhuma simplificação para melhorar a nota
`,
)

console.log(`\nResumo em ${path.relative(root, path.join(outDir, 'RESULTS.md'))}`)
console.table(results.map((r) => ({ página: r.page, perfil: r.profile, ...r.scores, lcp: Math.round(r.lcp), cls: +r.cls.toFixed(3), tbt: Math.round(r.tbt) })))
