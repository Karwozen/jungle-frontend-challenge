# Análise da auditoria Lighthouse

Números: `lighthouse/RESULTS.md` (gerado por `npm run lighthouse`). Relatórios completos: `lighthouse/reports/`.

## Resultado

| Página | Perfil | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Início | desktop | 99 ✅ | 96 ✅ | 100 ✅ | 92 ✅ |
| Detalhe | desktop | 99 ✅ | 100 ✅ | 100 ✅ | 92 ✅ |
| Início | mobile | **84** ⚠️ | 96 ✅ | 100 ✅ | 92 ✅ |
| Detalhe | mobile | **86** ⚠️ | 100 ✅ | 100 ✅ | 92 ✅ |

CLS ficou entre 0 e 0,017 e o TBT entre 0 e 77 ms em todos os casos: ambos dentro do "bom". A única meta não atingida é **Performance no mobile** (4 a 6 pontos abaixo de 90).

## Por que o mobile fica abaixo

O perfil mobile do Lighthouse simula um Moto G Power com CPU 4× mais lenta e 4G lento. O LCP medido é de 3,6 a 3,9 s (desktop: 0,9 s). O que pesa, em ordem:

1. **Cadeia de dependências até a primeira imagem.** O app é uma SPA renderizada no cliente e as imagens do catálogo só são descobertas no fim de uma cadeia: HTML → `index.js` (205 kB) → chunk do MSW (96 kB) e registro do service worker → resposta da API simulada (90 a 200 ms de latência configurada) → render dos cards → download da imagem. Com a CPU 4× mais lenta, o "atraso de renderização" sozinho passa de 1,5 s.
2. **JavaScript inicial.** O relatório aponta ~119 kB de JavaScript sem uso na carga inicial (economia estimada de 600 ms no cenário simulado). Parte dele é a própria camada de mocks, que a spec exige no build de demonstração.
3. **Imagens.** O Lighthouse estima ~177 kB de economia se as imagens fossem entregues em tamanho mais próximo do exibido.

A causa 1 é estrutural: remover o MSW da carga ou entregar HTML já com os dados (SSR/pré-renderização) deixaria de cumprir "mocks no build publicado, sem backend" ou mudaria a arquitetura pedida (SPA com TanStack Router e Query).

## O que foi feito

- Primeiros cards do catálogo acima da dobra com `loading="eager"` e `fetchPriority="high"` (o relatório inicial mostrava o LCP em uma imagem `lazy`).
- `sizes` correto na imagem do destaque no mobile (8rem em vez de 100vw).
- Divisão de código por rota (`autoCodeSplitting` do TanStack Router) e o MSW e o painel de mocks carregados sob demanda.
- Skeletons com as dimensões do conteúdo (CLS ≤ 0,017) e `font-display` correto nas fontes.

Tentado e descartado: carregar o código da rota em paralelo com a subida do MSW (`router.load()` antes dos mocks). Os guards das rotas privadas rodariam sem a API simulada no ar e derrubariam a recarga de páginas como `/wallets`.

## O que ainda daria ganho

- Separar o que o MSW carrega no início (worker, handlers, banco) em chunks menores, para a primeira renderização não esperar todos.
- Gerar variantes menores das imagens do catálogo para telas pequenas (hoje: 640, 1200).
- Pré-carregar (`<link rel="preload">`) a imagem do primeiro destaque: possível porque o primeiro slide é fixo, mas hoje o arquivo vem do payload da API.
