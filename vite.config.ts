import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fetch these chunks early without evaluating the router before MSW patches WebSocket.
function preloadBootstrap(): Plugin {
  return {
    name: 'kurio-preload-bootstrap',
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        if (!bundle) return []
        const modules = ['/src/mocks/browser.ts', '/src/app/router.tsx']
        return Object.values(bundle).flatMap(chunk => {
          if (chunk.type !== 'chunk' || !modules.some(path => chunk.facadeModuleId?.replaceAll('\\', '/').endsWith(path))) return []
          return [{ tag: 'link', attrs: { rel: 'modulepreload', href: '/' + chunk.fileName, crossorigin: true }, injectTo: 'head-prepend' as const }]
        })
      },
    },
  }
}

export default defineConfig({ plugins: [react(), tailwindcss(), preloadBootstrap()], server: { port: 5173, strictPort: true } })
