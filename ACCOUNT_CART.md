# Conta, sessão e carrinho — estado implementado

## Experimentar

`npm run dev:mocks` serve http://127.0.0.1:5173. Rotas novas: /register, /login,
/account/profile e /cart. No detalhe do NFT, escolha quantidade e adicione ao carrinho.
Os itens são preservados após refresh e autenticação. O botão Entrar conserva o
endereço atual como destino de retorno, validado para permanecer na aplicação.

Credenciais inteiramente fictícias:

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Alice | alice@kurio.test | Kurio2026! |
| Bruno | bruno@kurio.test | Kurio2026! |

Cupom válido: KURIO10 (10%). EXPIRED simula cupom expirado; outros códigos são
inválidos. As ações passam pelo Axios e pelos handlers MSW.

## Contratos implementados

- POST /api/register: name, email, password; cria conta e retorna user, token, expiresAt.
- POST /api/login: email, password; retorna o mesmo formato de sessão.
- GET /api/session: user e expiresAt, ou user null para visitante.
- POST /api/logout: invalida o token atual.
- GET /api/profile: nome e e-mail da conta autenticada.
- POST /api/demo/expire-session: expira a sessão atual para demonstrar recuperação.
- GET /api/cart: itens, cupom, subtotal, desconto, taxa de rede e total.
- POST /api/cart: nftId e quantity; soma um item, validando quantidade e estoque.
- PATCH /api/cart/:id: quantity; atualiza quantidade inteira dentro do estoque.
- DELETE /api/cart/:id: remove item.
- POST /api/cart-coupon: code; valida e aplica cupom.
- DELETE /api/cart-coupon: remove cupom.
- POST /api/demo/reset: restaura catálogo, usuários, sessões e carrinhos.

Erros seguem message, code e, quando aplicável, fields. Registro conflitado retorna
409; formulários e cupons inválidos retornam 422; sessão expirada, 401; estoque,
409; recurso inexistente, 404.

## Persistência e isolamento

O armazenamento de conta da simulação contém hashes PBKDF2 SHA-256 (100 mil
iterações) e salt aleatório por usuário. Senhas recebidas nos formulários não são
persistidas em claro. O token opaco é mantido no armazenamento local do cliente,
com expiração de 30 minutos no banco de mocks. Este desenho é exclusivo da
demonstração; não representa autenticação de produção.

Query keys privadas começam com private e contêm a identidade do usuário. Logout
e autenticação cancelam consultas e removem caches privados. Falhas 401 com código
SESSION_EXPIRED limpam a sessão e redirecionam rotas privadas, preservando o retorno.
As subscriptions implementadas até esta etapa são públicas (nft.updated).

Carrinhos são separados por usuário e por identidade do visitante. Na primeira
consulta autenticada, os itens do visitante são unidos ao carrinho da conta e o
carrinho visitante é consumido, evitando reaplicar a união após refresh. Quantidades
que se tornem superiores ao estoque aparecem como conflito a ser corrigido na UI;
não são descartadas silenciosamente. O checkout ainda precisa revalidá-las.

Todos os valores ETH são strings decimais no transporte e BigInt nos cálculos.
O cupom aplica desconto inteiro em wei; a taxa simulada de carrinho não vazio é
0.005 ETH. O evento público de atualização do NFT invalida o carrinho ativo e
reconsulta preços e estoque via REST.

## Perfil e carteiras

O perfil permite editar nome, e-mail e avatar (PNG, JPEG ou WebP de até 1 MiB).
A senha pode ser alterada mediante confirmação da senha atual. A API simulada
oferece PATCH /api/profile e POST /api/password. Há até duas carteiras simuladas
por conta, nas redes Ethereum e Polygon, com endereços EVM e uma principal;
as rotas GET/POST /api/wallets e PATCH /api/wallets/:id. Os dados ficam no
armazenamento local do navegador, isolados por conta, para demonstração.

## Validação e pendências

Build e lint passaram. Dezesseis testes E2E em Chromium desktop/mobile passaram,
incluindo perfil, avatar, senha, carteiras, isolamento entre usuários, catálogo
e carrinho. Compra, recibo e pagamento simulado estão descritos em CHECKOUT.md. Edições do
NFT, favoritos e cenários de falha avançados continuam pendentes.
