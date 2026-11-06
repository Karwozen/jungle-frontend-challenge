# Contratos da simulação

As rotas abaixo são atendidas pelo MSW no navegador. Não há backend remoto.
Dados e sessão pertencem ao armazenamento local do navegador. Use apenas as
credenciais fictícias documentadas no README.

## Convenções

- Requisições autenticadas usam `Authorization: Bearer <token>`. O cliente envia
  `X-Guest-Id` para identificar o carrinho visitante.
- Erros de aplicação usam `{ code, message, fields? }`. Podem ocorrer 401 para
  sessão inválida, 404 para recurso inexistente, 409 para conflito e 422 para
  validação. Falhas simuladas também podem retornar 503 ou falha de transporte.
- ETH trafega como string decimal, sem ponto flutuante; quantidade é inteira.
  Os schemas e tipos estão em `src/shared/`.

## Catálogo

`GET /api/nfts` aceita `q`, `collection`, `network`, `minPrice`, `maxPrice`,
`sort` (`recent`, `price-asc`, `price-desc`), `page` e `view` (`new` ou `trending`, para as seleções editoriais do mock). Retorna
`{ items, total, page, pageSize }`, com nove itens por página. `GET /api/nfts/:id`
retorna o NFT ou 404. Um NFT inclui identidade, coleção, preço, disponibilidade,
versão, rede, arte, galeria e lista de edições com preço e estoque próprios.

## Conta, carteira e favoritos

| Método e rota | Entrada e resultado |
| --- | --- |
| `POST /api/register` | `name`, `email`, `password`; retorna usuário, token e expiração. E-mail duplicado causa 409. |
| `POST /api/login` | `email`, `password`; retorna usuário, token e expiração. |
| `GET /api/session` | Usuário e expiração; sem token retorna `{ user: null }`. |
| `POST /api/logout` | Invalida a sessão e retorna `{ ok: true }`. |
| `GET /api/profile` | Dados públicos do usuário autenticado. |
| `PATCH /api/profile` | Atualiza nome, e-mail e avatar. |
| `POST /api/password` | Recebe `currentPassword` e `newPassword`. |
| `GET /api/wallets` | Lista as carteiras do usuário. |
| `POST /api/wallets` | Recebe `label`, `address`, `network`, `primary`; cria carteira. |
| `PATCH /api/wallets/:id` | Atualiza os mesmos dados de uma carteira existente. |
| `GET /api/favorites` | Lista IDs favoritos do usuário. |
| `PUT /api/favorites/:nftId` / `DELETE /api/favorites/:nftId` | Adiciona ou remove favorito; retorna a lista atualizada. |

Carteiras aceitam Ethereum, Polygon ou Solana; o endereço é validado conforme a
rede. Até duas carteiras são permitidas. Sessão e cache privado são isolados por
identidade; sessão expirada retorna `SESSION_EXPIRED` nas rotas protegidas.

## Carrinho, cotação e pedido

`GET /api/cart` retorna `{ items, coupon, subtotal, discount, networkFee, total }`.
Cada item inclui `id`, `nft`, `edition` e `quantity`. O visitante é identificado
pelo cabeçalho de convidado; seus itens são unidos ao carrinho da conta ao autenticar.

`POST /api/cart` recebe `{ nftId, editionId?, quantity }`. `PATCH /api/cart/:id`
recebe `{ quantity }`; `DELETE /api/cart/:id` remove a linha. O `id` da linha
identifica NFT e edição. `POST /api/cart-coupon` recebe `{ code }` e
`DELETE /api/cart-coupon` remove o cupom. Essas operações retornam o carrinho.

`POST /api/quotes` exige sessão e cria `{ id, cart, expiresAt }`; a cotação vale
dois minutos. `POST /api/orders` exige `Idempotency-Key` e recebe `quoteId`,
`walletId`, `network`, `name`, `email`, `accepted` e os dados de colecionador
descritos em `src/shared/orders.ts`. A mesma chave e conteúdo recuperam o mesmo
pedido; conteúdo diferente causa conflito. Mudanças na cotação exigem revisão.
`GET /api/orders/:id` consulta um pedido do usuário. O pedido passa de `pending`
para `confirmed` ou `declined`; apenas confirmação consome as quantidades compradas.
O recibo usa o snapshot do pedido. Detalhes e limitações estão em `CHECKOUT.md`.

## Eventos

O cliente Socket.IO conecta em `wss://realtime.kurio.test`, interceptado pelo MSW.
`nft.updated` e `order.updated` carregam `{ eventId, resourceId, version, data }`.
Para receber pedidos, o cliente envia `order.subscribe` com `token` e `orderId`;
o mock verifica a sessão na inscrição e na emissão. Na reconexão, os recursos são
consultados novamente via REST. O pedido pendente também utiliza polling. Eventos
de pedido de outro usuário, outra identidade ou versão antiga são descartados.
Consulte `MOCK_SCENARIOS.md` para interrupção, falhas e limitações do transporte.
