# Arquitetura e Decisões Técnicas

## Estrutura de Diretórios e Fluxo de Dependências

```
src/
  routes/       Definição de rotas file-based (TanStack Router) e guards de autenticação
  pages/        Composição das páginas e seções específicas de cada tela
  components/   Componentes reutilizáveis de UI (shadcn/ui, layout, auth, cart, nft, wallet)
  features/     Regras de negócio no cliente: sessão, carrinho híbrido, favoritos, tempo real e filtros
  domain/       Schemas Zod, clientes HTTP (Axios) e query options por domínio
  mocks/        Simulação de backend na rede: handlers REST, servidor Socket.IO, banco local e cenários
  lib/          Infraestrutura compartilhada: instância Axios, aritmética ETH (big.js), storage e helpers
e2e/            Suíte de testes ponta a ponta e regressão visual com Playwright
```

A arquitetura segue um fluxo unidirecional estrito de dependências (`routes` → `pages` → `components` → `features` → `domain` → `lib`). Nenhum componente de interface ou hook de domínio conhece detalhes internos da camada `mocks/`: toda a comunicação ocorre via HTTP (`Axios`) e WebSocket (`socket.io-client`), interceptados de forma transparente pelo Service Worker do MSW.

## Contratos da API REST e Validação

Todas as respostas e payloads de entrada são validados com schemas Zod localizados em `src/domain/<recurso>/schema.ts`. Valores monetários em ETH trafegam como strings decimais e são manipulados com `big.js` (precisão de 18 casas decimais com truncamento) para evitar erros de ponto flutuante.

| Domínio | Endpoints |
|---|---|
| Autenticação | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/social`, `GET /api/auth/session`, `POST /api/auth/logout` |
| Catálogo de NFTs | `GET /api/nfts` (busca, filtros, ordenação, paginação e `facets`), `GET /api/nfts/:id`, `GET /api/nfts/:id/reviews`, `GET /api/nfts/featured`, `GET /api/nfts/spotlight` |
| Favoritos | `GET /api/favorites`, `PUT /api/favorites/:nftId`, `DELETE /api/favorites/:nftId` |
| Carrinho | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `PUT /api/cart/coupon`, `DELETE /api/cart/coupon`, `POST /api/cart/merge`, `POST /api/cart/acknowledge` |
| Cotação | `POST /api/quote` (cálculo de disponibilidade, cupom, desconto, taxa de rede e total) |
| Pedidos | `POST /api/orders` (requer cabeçalho `Idempotency-Key`), `GET /api/orders`, `GET /api/orders/:id` |
| Perfil | `GET /api/profile`, `PATCH /api/profile`, `PUT /api/profile/avatar`, `DELETE /api/profile/avatar`, `PUT /api/profile/password` |
| Carteiras | `GET /api/wallets`, `POST /api/wallets`, `PUT /api/wallets/:id`, `POST /api/wallets/:id/connect`, `POST /api/wallets/:id/disconnect` |

O endpoint `GET /api/nfts` retorna, além da página de itens, os agregadores `facets.categories`, `facets.networks` e `facets.price` (`{ min, max }`). Os limites mínimo e máximo de preço acompanham os filtros ativos (exceto a própria faixa de preço) e são opcionais no schema para que a listagem continue funcional mesmo se os limites não estiverem disponíveis.

Os erros seguem o envelope padronizado `{ status, code, message, fields? }`, cobrindo `VALIDATION` (422), `UNAUTHENTICATED` e `SESSION_EXPIRED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), conflitos de negócio (409: `QUOTE_STALE`, `QUOTE_EXPIRED`, `AVAILABILITY_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `WALLET_NOT_CONNECTED`) e falhas transitórias `UNAVAILABLE` (503).

### Idempotência na Criação de Pedidos

O endpoint `POST /api/orders` exige o cabeçalho `Idempotency-Key`. Se o cliente reenviar a mesma chave com o mesmo payload, o servidor devolve o pedido já registrado; se a chave for reutilizada com parâmetros diferentes, retorna `409 IDEMPOTENCY_CONFLICT`. Quando ocorre um timeout de rede no cliente, a tela de checkout preserva o payload e a chave da tentativa em memória para que o botão "Confirmar compra" recupere o pedido criado sem duplicá-lo. O recibo emitido congela um snapshot imutável dos itens, valores e carteira utilizados na transação.

## Tempo Real e Reconciliação (Socket.IO + REST)

| Evento | Conteúdo | Comportamento no Cliente |
|---|---|---|
| `nft.updated` | `id`, `version`, `occurredAt`, `resource`, `price`, `previousPrice`, `soldOut`, `editions` | Atualiza imediatamente o cache de detalhe, listagens e destaques; se o NFT estiver no carrinho, invalida carrinho/cotação e emite aviso visual e em região `aria-live` |
| `order.updated` | `id`, `version`, `resource`, `status`, `txHash`, `explorerUrl`, `failureReason` | Atualiza o pedido apenas se ainda estiver `pending` (estados `confirmed` e `refused` são terminais) |

O utilitário `EventGuard` registra os IDs de eventos já processados e a maior `version` conhecida de cada recurso, descartando pacotes duplicados ou fora de ordem. Eventos de pedidos são restritos ao proprietário da sessão ativa tanto no emissor simulado quanto no cliente.

### Reconciliação após Queda de Conexão

Quando a conexão Socket.IO sofre queda e se reconecta, o componente `RealtimeSync` invalida as queries de catálogo, cotação, carrinho e pedidos do usuário para sincronizar o estado com a fonte da verdade (REST). Adicionalmente, a tela de pedido pendente realiza polling a cada 2 segundos enquanto aguarda liquidação. Ao fazer logout ou trocar de usuário, a conexão Socket.IO anterior é encerrada, os listeners são removidos e o `EventGuard` é reiniciado.

### Transporte Socket.IO e Limitações do Ambiente de Mocks

- A simulação utiliza `ws.link` do MSW em conjunto com `@mswjs/socket.io-binding`, enquanto a aplicação conecta através do `socket.io-client` oficial. Apenas o transporte `websocket` é utilizado (`transports: ['websocket']`), pois o HTTP long-polling padrão do Socket.IO não é interceptado pelo binding WebSocket do MSW.
- Como o MSW substitui o construtor global `WebSocket` ao iniciar, o `socket.io-client` é importado dinamicamente após o início dos mocks para garantir que utilize a instância interceptada em `wss://realtime.kurio.mock` sem interferir no WebSocket de HMR do Vite.
- O `@mswjs/socket.io-binding` não envia pacotes de ping automaticamente; por isso o handler simulado emite pacotes de ping do protocolo Engine.IO a cada 20 s para manter a conexão ativa.
- O estado simulado persiste no `localStorage` do navegador, de modo que contextos de navegação isolados possuem bancos independentes.

## Gestão de Sessão e Autenticação Social

O token retornado pelo login tradicional (`/api/auth/login`), cadastro (`/api/auth/signup`) ou autenticação social Google/Facebook (`/api/auth/social`) é armazenado em `localStorage` (`kurio.token`) e anexado pelo interceptor do Axios no cabeçalho `Authorization`.

- **Rotas protegidas (`requireSession`):** Visitantes sem sessão ativa são redirecionados para a página inicial com o modal de autenticação aberto (`?auth=login&redirect=...`) e retornam automaticamente à rota desejada após autenticar.
- **Expiração de sessão (`SESSION_EXPIRED`):** O tratador global limpa o cache privado (`['user', id, ...]`), remove o token e abre o diálogo de login sobre a tela atual com aviso contextual.

## Estratégia de Carrinho (Visitante vs. Autenticado)

- **Visitante:** Os itens são persistidos localmente em `kurio.guest-cart` e enriquecidos com os dados do catálogo; o cálculo de subtotal, desconto e taxa de rede utiliza `POST /api/quote`.
- **Usuário autenticado:** O carrinho reside no servidor (`/api/cart`). No momento do login ou cadastro, `mergeGuestCart()` envia os itens locais para `POST /api/cart/merge` (limitando ao estoque disponível) e limpa o storage local antes de publicar a sessão no cache do React Query.
- Todas as mutações de carrinho cancelam buscas concorrentes em andamento (`cancelQueries`) para evitar condições de corrida.

## Política de Cache e Retentativas (TanStack Query)

| Recurso | `staleTime` | Estratégia |
|---|---|---|
| Listagem do catálogo | 30 s | `keepPreviousData` na troca de página/filtros; chave baseada nos parâmetros normalizados |
| Detalhe, destaques e avaliações | 60 s | Atualização instantânea via `nft.updated` |
| Sessão do usuário | 5 min | Sem retry automático |
| Carrinho | 30 s | Sincronizado diretamente pelo retorno das mutações |
| Cotação (`/api/quote`) | 0 | Sempre revalidada para garantir preços e disponibilidade atualizados |
| Perfil e carteiras | 5 min | Invalidados após edições |
| Favoritos | 60 s | Mutação otimista com rollback em caso de falha |

Apenas erros transitórios (falha de rede, HTTP 408 e 5xx) sofrem retry automático (até 2 vezes). Erros 4xx de validação, autenticação ou conflito falham imediatamente.

## Acessibilidade, Ajustes de Layout e Decisões de UX

- **Acessibilidade:** Navegação completa por teclado com anel de foco visível, skip-link `"Ir para o conteúdo"`, retenção e devolução de foco em diálogos e drawers (Radix UI), associação de mensagens de erro via `aria-describedby` + `role="alert"`, anúncios em regiões `aria-live` para eventos em tempo real e respeito integral a `prefers-reduced-motion`.
- **Prevenção de CLS:** Todos os estados de carregamento utilizam componentes `Skeleton` com efeito shimmer e dimensões idênticas ao conteúdo final.
- **Desvios intencionais e decisões de UX em relação ao Figma:**
  - **Checkout no mobile:** Além do resumo da carteira e total previstos no frame mobile, a tela também apresenta os campos do colecionador, observação e revisão dos itens para atender aos requisitos funcionais de validação e revisão em qualquer largura de tela.
  - **Onboarding de carteira:** Usuários autenticados sem carteira cadastrada são orientados no checkout a registrar uma carteira em `/wallets` antes de concluir o pedido.
  - **Sufixo ENS:** O campo de nome ENS permite escolher o sufixo (`.eth`, `.btc`, `.sol`, `.crypto`, `.bnb`), persistido no modelo da carteira.
  - **Ordenação e ergonomia:** As coleções nos filtros e no rodapé são listadas em ordem alfabética, os controles do slider de preço foram ampliados para facilitar o arraste em toque/mouse e os cards do catálogo mobile ficam nivelados na grade.
  - **Ações fora do escopo:** Links editoriais, suporte, atividade, ofertas, downloads e exploração externa no Etherscan exibem um aviso informativo (`Fora do escopo desta demonstração`) sem simular falso sucesso, conforme exigido pelo enunciado.

## Performance e Limitações Conhecidas

- **Lighthouse:** No perfil Desktop, todas as categorias superam as metas (Performance 99, Accessibility 96–100, Best Practices 100, SEO 92). No perfil Mobile, Accessibility (96–100), Best Practices (100) e SEO (92) superam as metas, enquanto Performance registra mediana de 84 (Início) e 86 (Detalhe). Conforme detalhado em [lighthouse/ANALISE.md](lighthouse/ANALISE.md), isso decorre da arquitetura SPA com MSW executando no navegador sob throttling de CPU 4× do Lighthouse, onde a descoberta das imagens depende da inicialização do Service Worker e da resposta simulada da API.
- **Snapshots de regressão visual:** As imagens de referência em `e2e/__screenshots__` foram geradas em ambiente Windows; ao executar em outro sistema operacional, recomenda-se atualizar as baselines locais via `npm run test:e2e:visual:update`.
