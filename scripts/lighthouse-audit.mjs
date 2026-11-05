import { spawn } from 'node:child_process'
import process from 'node:process'
import console from 'node:console'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { platform, release, cpus, totalmem } from 'node:os'
import { setTimeout as wait } from 'node:timers/promises'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import * as chromeLauncher from 'chrome-launcher'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url)
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputDir = `audits/lighthouse/${stamp}`
const base = 'http://127.0.0.1:4173'
const chromePath = process.env.CHROME_PATH || chromium.executablePath()
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
let serverLog = ''
server.stdout.on('data', chunk => { serverLog += chunk })
server.stderr.on('data', chunk => { serverLog += chunk })
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const runs = []
try {
  await mkdir(outputDir, { recursive: true })
  let ready = false
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`O preview encerrou: ${serverLog}`)
    if (serverLog.includes('http://127.0.0.1:4173')) { ready = true; break }
    await wait(100)
  }
  if (!ready) throw new Error(`Preview não iniciou em 10 segundos: ${serverLog}`)
  for (const [page, path] of [['inicio', '/'], ['detalhe', '/nfts/emerald-ape-42']]) {
    for (const profile of ['mobile', 'desktop']) {
      for (let run = 1; run <= 3; run++) {
        console.log(`Lighthouse: ${page}, ${profile}, medição ${run}/3`)
        const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] })
        try {
          const result = await lighthouse(base + path, { port: chrome.port, output: ['html', 'json'], logLevel: 'error' }, profile === 'desktop' ? desktopConfig : undefined)
          if (!result || result.lhr.runtimeError) throw new Error(result?.lhr.runtimeError?.message || 'Lighthouse não retornou resultado')
          const name = `${page}-${profile}-${run}`
          const [html, json] = result.report
          await writeFile(`${outputDir}/${name}.html`, html)
          await writeFile(`${outputDir}/${name}.json`, json)
          const lhr = result.lhr
          runs.push({ page, profile, run, scores: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(id => [id, lhr.categories[id]?.score == null ? null : lhr.categories[id].score * 100])), metrics: Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(id => [id, lhr.audits[id]?.numericValue ?? null])), browser: lhr.environment.networkUserAgent })
        } finally { await chrome.kill() }
      }
    }
  }
  const summaries = []
  for (const page of ['inicio', 'detalhe']) for (const profile of ['mobile', 'desktop']) {
    const group = runs.filter(item => item.page === page && item.profile === profile)
    const summarize = key => Object.fromEntries(Object.keys(group[0][key]).map(id => { const values = group.map(item => item[key][id]); return [id, values.some(value => value == null) ? null : median(values)] }))
    summaries.push({ page, profile, medianScores: summarize('scores'), medianMetrics: summarize('metrics') })
  }
  const report = { createdAt: new Date().toISOString(), environment: { node: process.version, lighthouse: require('lighthouse/package.json').version, chromeLauncher: require('chrome-launcher/package.json').version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem(), browserSource: process.env.CHROME_PATH ? 'CHROME_PATH' : 'Playwright Chromium', note: 'Preview do build otimizado local; mocks habilitados; novo perfil temporário de navegador por medição; perfis padrão Lighthouse mobile e desktop; rede e CPU simuladas pelo Lighthouse.' }, runs, summaries }
  await writeFile(`${outputDir}/summary.json`, JSON.stringify(report, null, 2))
  console.log(`Relatórios em ${outputDir}`)
  console.log(JSON.stringify(summaries, null, 2))
} finally { server.kill() }
