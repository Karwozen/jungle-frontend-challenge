import { setupWorker } from 'msw/browser'
import { resetDb } from '@/mocks/db'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios'

const worker = setupWorker(...handlers)

// Restaura as fixtures iniciais do banco simulado e limpa o cenário quando ?mock-reset está presente na URL
function resetFromUrl() {
  const url = new URL(location.href)
  if (!url.searchParams.has('mock-reset')) return

  resetDb()
  setScenario('default')
  url.searchParams.delete('mock-reset')
  history.replaceState(null, '', url)
}

// Suprime rejeições benignas de atualização do Service Worker do MSW durante recarregamentos
function ignoreWorkerUpdateFailure() {
  window.addEventListener('unhandledrejection', (event) => {
    if (String(event.reason?.message).includes('Failed to update a ServiceWorker')) event.preventDefault()
  })
}

export async function startMocks() {
  ignoreWorkerUpdateFailure()
  resetFromUrl()
  await worker.start({ onUnhandledRequest: 'bypass' })
}
