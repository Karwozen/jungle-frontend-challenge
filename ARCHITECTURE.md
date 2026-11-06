# Arquitetura da solução

## Execução

```bash
npm ci
npm run dev:mocks
npm run typecheck
npm run lint
npm run build
npm run preview
npm run test:e2e
npm run audit:lighthouse
```

Validado com Node.js 24.19.0. Instale o navegador de testes com
`npx playwright install chromium` quando necessário.

O servidor local usa `npm run dev:mocks` e expõe `http://127.0.0.1:5173`.
Os dados de demonstração são persistidos no `localStorage`; `POST /api/demo/reset`
restaura catálogo, contas, carrinhos, favoritos, cotações e pedidos. As contas
fictícias são `alice@kurio.test` e `bruno@kurio.test`, ambas com senha inicial
`Kurio2026!`. `VITE_ENABLE_MOCKS=false` desliga o worker MSW, mas não existe
backend real nesta entrega.

Contratos REST e eventos: `API_CONTRACTS.md`. Cenários: `MOCK_SCENARIOS.md`.

## Camadas

- `src/app`: bootstrap, providers, Router e shell da aplicação.
- `src/features`: catálogo, favoritos, carrinho, checkout, pedidos e conta.
- `src/shared`: contratos TypeScript, schemas Zod, Axios e aritmética ETH com BigInt.
- `src/mocks`: handlers MSW, fixtures persistentes e transporte Socket.IO simulado.
- `tests/e2e`: fluxos Playwright em Chromium desktop e mobile.

TanStack Router controla rotas e busca; TanStack Query controla consultas, mutations,
invalidação e cache; Axios é o único cliente REST. O layout usa Tailwind CSS e os
componentes locais derivados de shadcn/ui.

## Conta e isolamento

O mock armazena senha como PBKDF2-SHA-256 com salt aleatório via Web Crypto. O
token opaco e sua expiração de 30 minutos ficam no banco de demonstração. Query
keys privadas sempre incluem o identificador do usuário. Logout cancela consultas,
remove caches privados e desconecta listeners da sessão anterior.

Perfil, avatar, senha, carteiras e favoritos são rotas protegidas. Favoritos usam
`GET /api/favorites`, `PUT /api/favorites/:nftId` e `DELETE /api/favorites/:nftId`;
a mutação é otimista, guarda snapshot e faz rollback quando a API retorna erro.

## Carrinho e pedido

Preços e totais trafegam como strings decimais. `src/shared/money.ts` converte para
BigInt em wei antes de calcular subtotal, desconto, taxa e total. O visitante tem
identidade própria e seus itens são unidos à conta no primeiro acesso autenticado.

`POST /api/quotes` cria cotação com validade de dois minutos. `POST /api/orders`
exige `Idempotency-Key`, valida cotação, estoque, carteira, rede e dados do
colecionador. A mesma chave com o mesmo conteúdo retorna o mesmo pedido; com
conteúdo diferente retorna conflito. O pedido percorre `pending -> confirmed` ou
`pending -> declined`. O recibo guarda snapshot do carrinho e só a confirmação
remove as quantidades compradas.

Os cenários `success`, `declined` e `timeout` podem ser selecionados com
`POST /api/demo/payment-scenario` ou no painel `/demo/scenarios`. O timeout cria o pedido antes da falha de
transporte, permitindo recuperação pelo mesmo identificador.

## Tempo real

`socket.io-client` conecta em `wss://realtime.kurio.test`; MSW e
`@mswjs/socket.io-binding` simulam o protocolo WebSocket. `nft.updated` atualiza
catálogo e invalida carrinho. O checkout assina `order.updated` após enviar
`order.subscribe` com token e pedido. O cliente rejeita recurso, usuário, evento
antigo ou versão regressiva. Ao reconectar, consulta REST; pedidos pendentes também
fazem polling de dois segundos. Listeners e timers são liberados no unmount.

No build de produção, o HTML antecipa o download dos módulos de mocks e de
rotas. A execução mantém a ordem: o MSW instala o interceptor de WebSocket
antes da avaliação do cliente Socket.IO. A latência do catálogo é controlada
pelo cenário de rede, e o estado de carregamento é verificado com esse cenário.

## Interface e limitações conhecidas

O catálogo e detalhe têm skeletons com shimmer, estados vazios e de erro, labels
e foco visível. Testes cobrem 390 e 1440 pixels; o layout foi revisado também em
768 pixels. A identidade obrigatória é a do Figma. A revisão visual ainda está em curso.

Emerald Ape, Sage Nomad, Neon Vessel e Golden Beat são assets exportados do Figma.
A fonte local IBM Plex Mono é uma substituição provisória. Portanto, a fidelidade visual
integral e as metas Lighthouse ainda não estão comprovadas. A matriz completa fica
em `REQUIREMENTS_STATUS.md`.

## Verificação

Em 05/11/2026, build e lint passaram e a suíte Playwright teve 97 testes aprovados
e três ignorados por layout. A suíte cobre fluxos, falhas de rede e reconexão.
Relatórios HTML e traces são gerados em `playwright-report` e `test-results`.
Oito snapshots visuais foram criados no Chromium para Windows; não representam
comparação automática com o Figma. Em outros sistemas, esses testes são ignorados
até existirem referências próprias. Ver `DEVELOPMENT.md` e `MOCK_SCENARIOS.md`.

O arquivo `vercel.json` configura o fallback de rotas para o `index.html`. A
[aplicação pública](https://jungle-frontend-challenge-mocha.vercel.app/) é ligada
ao branch `main` do [repositório de entrega](https://github.com/Karwozen/jungle-frontend-challenge).
O remoto `origin` continua apontando ao desafio original; a publicação usa
`entrega`.
