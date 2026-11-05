import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from './app/query'
import './styles.css'
async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }
  // Engine.IO captures WebSocket during module evaluation. Load it after MSW
  // installs its interceptor, otherwise connections bypass the mock transport.
  const { router } = await import('./app/router')
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router}/></QueryClientProvider></React.StrictMode>)
}
void bootstrap().catch(() => { document.getElementById('root')!.textContent = 'Não foi possível iniciar a demonstração. Recarregue a página.' })
