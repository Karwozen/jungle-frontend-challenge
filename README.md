# Kurio — Marketplace de NFTs

[![Deploy with Vercel](https://vercel.com/button)](https://jungle-frontend-challenge-mocha.vercel.app/)

🚀 **Aplicação em Produção:** https://jungle-frontend-challenge-mocha.vercel.app/

Documentação complementar: [Enunciado do Desafio](docs/ENUNCIADO.md) · [Arquitetura e Decisões Técnicas](ARCHITECTURE.md) · [Resultados do Lighthouse](lighthouse/RESULTS.md) · [Análise de Performance](lighthouse/ANALISE.md)

Aplicação web responsiva de marketplace de colecionáveis digitais (NFTs) desenvolvida em **React 19 + TypeScript** para o desafio de engenharia frontend da Jungle Gaming. Todo o ecossistema — endpoints REST, autenticação por credenciais e provedores sociais (Google/Facebook), gestão de carteiras Web3, processamento de pedidos com idempotência e eventos em tempo real via Socket.IO — é interceptado na camada de rede com **MSW (Mock Service Worker)**, operando integralmente no navegador sem dependência de backend externo.

## Principais Funcionalidades e Diferenciais

- **Simulação realista na camada de rede (MSW + Socket.IO):** Handlers HTTP e servidor WebSocket (`wss://realtime.kurio.mock`) executam no navegador com persistência em `localStorage`, validação estrutural via Zod, códigos semânticos de erro (`QUOTE_STALE`, `SESSION_EXPIRED`, `IDEMPOTENCY_CONFLICT`) e senhas armazenadas exclusivamente como hashes SHA-256 com sal.
- **15 cenários de falha determinísticos:** Configuráveis via query string (`?scenario=...`) ou pelo painel interativo de simulação: latência elevada, jitter (respostas fora de ordem), erro 503 com retry automático, modo offline, timeout de rede, expiração de sessão, alteração de preço/estoque durante o checkout, pagamento recusado, liquidação manual e queda do WebSocket.
- **Autenticação completa (E-mail/Senha + Login Social Google & Facebook):** Fluxo de login, cadastro e autenticação social simulada (`POST /api/auth/social`), com mesclagem automática do carrinho de visitante ao entrar, proteção de rotas autenticadas e retomada transparente da navegação via `?redirect=`.
- **Checkout com chave de idempotência (`Idempotency-Key`):** Em caso de timeout na confirmação do pedido, o reenvio reutiliza a mesma chave e o mesmo payload para recuperar o pedido já criado no servidor sem risco de cobrança ou criação duplicada.
- **Sincronização em tempo real com reconciliação:** Eventos `nft.updated` e `order.updated` trafegam via Socket.IO com deduplicação por `id` e controle monotônico de `version`. Após reconexão, as queries ativas são revalidadas via REST.
- **Refinamentos de UX e Acessibilidade:**
  - Coleções ordenadas alfabeticamente nos filtros do catálogo e no rodapé;
  - Controle deslizante de faixa de preço com alças ampliadas para melhor ergonomia em telas de toque e desktop;
  - Grid de NFTs nivelado no mobile e barras de ação fixas no detalhe do NFT e no carrinho mobile;
  - Campo de cupom promocional com limpeza automática de erro ao editar e feedback integrado ao resumo da carteira;
  - Navegação completa por teclado, armadilha de foco em modais/drawers, suporte a `prefers-reduced-motion` e skeletons dimensionados para evitar Cumulative Layout Shift (CLS ≤ 0,017).

## Stack Tecnológica

- **Core:** React 19, TypeScript 5.9, Vite 7
- **Roteamento & Estado Assíncrono:** TanStack Router (file-based routing), TanStack Query v5, Axios
- **Tempo Real:** Socket.IO Client v4 + `@mswjs/socket.io-binding`
- **Estilização & UI:** Tailwind CSS v4, Radix UI / shadcn/ui, Lucide Icons
- **Formulários, Validação & Precisão Decimal:** React Hook Form, Zod v4, `big.js` (aritmética de 18 casas decimais para ETH)
- **Qualidade & Testes:** Playwright (E2E desktop/mobile + regressão visual), Lighthouse, ESLint

## Como Executar Localmente

Pré-requisitos: **Node.js 20.19+** e **npm 10+**.

```bash
npm ci
npx playwright install chromium   # instala o navegador para os testes E2E e auditoria Lighthouse
npm run dev                       # inicia em http://localhost:5173 com MSW habilitado
```

### Variáveis de Ambiente

Os arquivos `.env`, `.env.example` e `.env.production` acompanham o repositório para que o ambiente de demonstração e o deploy na Vercel já subam com a camada de mocks ativa:

| Variável | Valor Padrão | Finalidade |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Ativa o Service Worker do MSW (REST + Socket.IO) e o painel flutuante de controle. |
| `VITE_SOCKET_URL` | `wss://realtime.kurio.mock` | Endpoint WebSocket interceptado pelo MSW. |

## Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite com MSW ativo |
| `npm run build` | Executa checagem de tipos (`tsc -b`) e gera o bundle de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente em `http://localhost:4173` |
| `npm run typecheck` | Valida a tipagem estática do projeto |
| `npm run lint` | Executa análise estática com ESLint |
| `npm run test:e2e` | Roda toda a suíte Playwright (projetos `desktop` e `mobile`) |
| `npm run test:e2e:mobile` | Executa apenas a suíte mobile (viewport 390 px) |
| `npm run test:e2e:visual:update` | Atualiza os snapshots de regressão visual |
| `npm run test:e2e:report` | Abre o relatório HTML da última execução do Playwright |
| `npm run lighthouse` | Gera o build e executa 3 rodadas do Lighthouse por página e perfil |

## Contas de Teste e Cupons

| Perfil | E-mail | Senha | Características |
|---|---|---|---|
| **Juliana** | `juliana@kurio.dev` | `Kurio@2026` | Possui carteira principal e secundária cadastradas e 2 NFTs favoritados |
| **Theo** | `theo@kurio.dev` | `Kurio@2026` | Conta limpa (sem carteiras nem favoritos) para testar o onboarding de carteira |
| **Google / Facebook** | *(botões no modal)* | — | Autenticação social instantânea pelo diálogo de entrada ou cadastro |

- **Cupons promocionais disponíveis:** `WELCOME10` (10% de desconto), `COLLECTOR5` (5% de desconto) e `SUMMER25` (cupom expirado para validação de erro).

## Cenários de Simulação e Painel de Mocks

Os cenários podem ser acionados pela URL (`/?scenario=<nome>&on=<endpoint,endpoint>`), pelo **painel flutuante de mocks** (botão no canto inferior direito) ou pelas rotas internas `/api/__mock/*` durante os testes E2E:

| Cenário | Comportamento Simulado |
|---|---|
| `default` | Operação normal com latência realista entre 90 ms e 200 ms |
| `empty` | Catálogo e listas retornam vazios |
| `slow` | Atraso fixo de 3 s por requisição |
| `jitter` | Latência variável para exercitar concorrência e respostas fora de ordem |
| `server-error` | Erro HTTP 503 transitório (aciona até 2 retentativas automáticas nas leituras) |
| `offline` | Falha de rede imediata |
| `timeout` | Resposta retida além do limite de 10 s configurado no cliente HTTP |
| `session-expired` | Retorna `401 SESSION_EXPIRED` nos endpoints protegidos |
| `wallet-rejected` | Simula recusa de assinatura/conexão no provedor da carteira |
| `price-changed` | Altera o preço do item em +10% no fechamento do pedido (`409 QUOTE_STALE`) |
| `sold-out` | Esgota a edição selecionada antes da conclusão da compra |
| `order-timeout` | Persiste o pedido no banco, porém retém a resposta até estourar o timeout |
| `payment-refused` | Processa o pedido com status final `refused` mantendo o carrinho intacto |
| `manual-settlement` | Mantém o pedido como `pending` até ser liquidado manualmente no painel |
| `socket-offline` | Recusa conexões no servidor Socket.IO simulado |

**Reset completo:** Acesse `/?mock-reset` ou utilize a aba **Dados** no painel de simulação para restaurar todas as fixtures iniciais e voltar ao cenário `default`.

### Passo a Passo para Reproduzir os Fluxos de Falha

1. **Pagamento recusado (`payment-refused`):** Selecione o cenário `payment-refused` restrito ao endpoint `orders` e confirme a compra no checkout. O recibo exibirá o status de pagamento recusado e os itens permanecerão preservados no carrinho.
2. **Timeout com recuperação idempotente (`order-timeout`):** Ative `order-timeout` no endpoint `orders` e confirme o pagamento. Após o aviso de tempo esgotado, clique novamente em **"Confirmar compra"**: o cliente reenviará o mesmo payload com a mesma `Idempotency-Key` e recuperará o pedido já criado sem duplicar a transação.
3. **Alteração de preço ou estoque durante o checkout (`price-changed` / `sold-out`):** Ative `price-changed` em `orders` ou dispare uma alteração de preço pela aba **Tempo real** do painel enquanto estiver na tela de pagamento. O envio ficará bloqueado até que o comprador clique em **"Aceitar novos valores"**.
4. **Pedido pendente, queda do WebSocket e reconciliação (`manual-settlement`):** Ative `manual-settlement` em `orders`, finalize o pedido, desconecte o socket pelo painel e liquide o pedido em seguida. Ao reconectar o socket (ou recarregar a página), a interface se reconciliará com a API REST e exibirá o recibo final.
5. **Expiração de sessão (`session-expired`):** Ative `session-expired` nos endpoints `wallets`, `profile` ou `orders`. O diálogo de login abrirá automaticamente com o aviso de sessão expirada e, após autenticar, o usuário retomará exatamente a tela em que estava.
6. **Falha transitória e recuperação (`server-error` / `offline` / `timeout`):** Ative `server-error` em `nfts`, `detail`, `cart` ou `reviews`. A tela apresentará o estado de erro correspondente e permitirá recuperar a listagem clicando em **"Tentar novamente"** após retornar ao cenário `default`.

## Mapa de Rotas

| Caminho | Funcionalidade | Permissão |
|---|---|---|
| `/` | Home: carrossel de destaques, catálogo com busca, filtros, ordenação e paginação sincronizados na URL | Pública |
| `/nft/:id` | Página de detalhes do NFT, seletor de edições, especificações on-chain e avaliações | Pública |
| `/cart` | Carrinho de compras (local para visitante, sincronizado na API para usuário autenticado) | Pública |
| `/checkout` | Revisão de cotação, conexão de carteira e confirmação idempotente de pagamento | Autenticada |
| `/orders/:orderId` | Acompanhamento de pedido pendente, recibo confirmado ou aviso de pagamento recusado | Autenticada |
| `/profile`, `/wallets`, `/favorites` | Gestão de perfil, senha, carteiras Web3 e lista de interesse | Autenticada |

## Suíte de Testes E2E (Playwright)

Os 12 arquivos em `e2e/` exercitam a aplicação real sobre a camada de mocks nos perfis `desktop` (1440 px) e `mobile` (390 px), com relatório HTML versionado em `e2e/report` e baselines visuais em `e2e/__screenshots__`:

- `catalog.spec.ts`: busca textual sem acentos/case-insensitive, filtros combinados, ordenação, paginação e sincronização com a URL;
- `detail.spec.ts`: carregamento direto por rota, tratamento de NFT inexistente, seleção de edições, limites por pedido, zoom e avaliações;
- `auth.spec.ts`: criação de conta, login por credenciais, login social (Google e Facebook), expiração de sessão, proteção de rotas privadas e logout;
- `favorites.spec.ts`: atualização otimista ao favoritar/desfavoritar, rollback automático em caso de erro 503 e persistência;
- `cart.spec.ts`: adição, alteração de quantidade, remoção, aplicação/remoção de cupons e mesclagem do carrinho de visitante no login;
- `checkout.spec.ts`: fluxo completo de compra, recibo imutável, pagamento recusado, idempotência após timeout e conflitos de preço/estoque;
- `realtime.spec.ts`: atualização ao vivo de preço/estoque e status de pedido via Socket.IO, descarte de eventos duplicados/antigos e reconciliação pós-queda;
- `account.spec.ts`: atualização de dados pessoais, avatar, troca de senha e cadastro/edição de carteiras principal e secundária;
- `a11y.spec.ts`, `loading.spec.ts`, `responsive.spec.ts` e `visual.spec.ts`: acessibilidade por teclado/foco, skeletons com shimmer, ausência de overflow horizontal (390/768/1440 px) e regressão visual.

## Auditoria Lighthouse

Mediana de 3 execuções sobre o bundle de produção (`npm run lighthouse`):

| Página | Perfil | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Início | Desktop | 99 | 96 | 100 | 92 |
| Detalhe | Desktop | 99 | 100 | 100 | 92 |
| Início | Mobile | **84** | 96 | 100 | 92 |
| Detalhe | Mobile | **86** | 100 | 100 | 92 |

O detalhamento técnico das métricas (LCP, CLS, TBT) e das otimizações aplicadas encontra-se em [lighthouse/ANALISE.md](lighthouse/ANALISE.md).

## Deploy na Vercel

O projeto está publicado em https://jungle-frontend-challenge-mocha.vercel.app/.
O arquivo `vercel.json` configura o rewrite de todas as rotas da SPA para `index.html`, enquanto `.env.production` habilita automaticamente o MSW no ambiente publicado.
