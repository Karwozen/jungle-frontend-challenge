# Cotação e pedidos simulados

O formulário inclui nome de exibição, e-mail, nome de usuário, nome do perfil,
código de indicação, nome LNS, tipo de carteira, endereço secundário opcional e
observação opcional. O endereço principal é exibido a partir da carteira cadastrada,
sem aceitar alteração arbitrária durante o pagamento. As opções de tipo de carteira
são simuladas. LNS e indicação são dados validados por formato/tamanho; não há
resolução de nome nem serviço externo de convites.

Cada NFT da fixture pertence à rede Ethereum ou Polygon. O filtro por rede é
incluído na URL e na consulta REST. O detalhe e o carrinho exibem a rede de cada
NFT; ao criar pedido, o mock retorna 409 NETWORK_MISMATCH se qualquer item usar
rede diferente da carteira selecionada. O carrinho permanece intacto nesse caso.
Um carrinho com redes diferentes precisa ser separado em compras por rede.

O schema collectorSchema é compartilhado entre cliente e MSW. A API retorna 422
com fields quando esses campos são inválidos. O pedido armazena um snapshot dos
dados. Rascunhos são salvos em kurio.checkout-draft.<userId>; qualquer edição
invalida a revisão anterior. A autenticação recupera o rascunho da mesma conta e
exige conectar novamente a carteira e obter nova cotação. A criação bem-sucedida
remove o rascunho, preservando a tentativa idempotente até a resposta da API.

POST /api/quotes retorna { id, cart, expiresAt }. Exige login; rejeita carrinho
vazio e estoque insuficiente. A cotação expira em dois minutos. Valores em ETH
são strings e usam os cálculos BigInt do carrinho.

POST /api/orders recebe OrderInput e o header Idempotency-Key. Valida dados,
carteira/rede, aceite, expiração e igualdade da cotação com o carrinho atual.
Mudança responde 409 QUOTE_CHANGED e exige revisão novamente. A mesma chave e
conteúdo recuperam o mesmo pedido; conteúdo diferente retorna 409. Consulta:
GET /api/orders/:id, restrita ao dono (404 para pedido de outro usuário).

O estado pending evolui para confirmed ou declined após 2,5 segundos. Estados
terminais não se alteram. A consulta REST também reconcilia pedidos vencidos após
refresh: o mock não depende da sobrevivência do timer. A confirmação decrementa
estoque e subtrai apenas as quantidades compradas do carrinho. Recusa preserva
os itens. Recibo e carteira são snapshots imutáveis do pedido aceito.

A tentativa (chave + conteúdo) é persistida por identidade antes do envio. Em
falha de transporte, refresh ou sessão expirada, permanece disponível para recuperar
a mesma tentativa. Não se aplica retry automático a novas compras. A navegação
para /checkout/orders/:orderId ocorre após resposta da simulação.

Socket.IO: o cliente envia order.subscribe com token e orderId. O mock verifica
sessão na inscrição e emissão, filtra por dono e recurso e emite order.updated
com eventId/resourceId/version/data. O cliente rejeita eventos de outro recurso
ou usuário e não regride versão nem estado terminal. Na reconexão consulta REST;
polling de 2 segundos complementa a recuperação do pedido pendente. Listeners são
removidos no unmount. O binding MSW usa transporte WebSocket; não há servidor real,
rooms distribuídos ou sincronização entre navegadores independentes.

POST /api/demo/payment-scenario recebe { scenario: 'success' | 'declined' | 'timeout' }.
O timeout cria o pedido e demora 13 segundos para falhar; Axios expira em 12 segundos.
O reenvio com a mesma chave recupera o pedido sem atrasar outra vez.
POST /api/demo/reset limpa também pedidos e cotações.

Limites: mocks em localStorage são exclusivos da demonstração, sem transações
entre abas. A liquidação verifica estoque novamente. Interrupção explícita de
socket, eventos antigos/duplicados e fidelidade dos campos ao Figma ainda exigem
auditoria e cenários dedicados. Ver REQUIREMENTS_STATUS.md.


## Edições de NFT

Cada NFT fornece `editions: { id, name, price, available }[]`. A edição padrão
mantém o preço e a disponibilidade do resumo do catálogo. As demais edições têm
estoque e preço independentes. As opções 1/1, 1/10, 1/50 e Aberta seguem os rótulos vistos no Figma; preços e estoques são dados simulados.

`POST /api/cart` aceita `editionId` (padrão: `standard`). Cada linha retorna `id`,
`edition`, `nft` e `quantity`; `nft.price` e `nft.available` refletem a edição da
linha. PATCH/DELETE usam esse `id`, codificado na URL, em vez de assumir o NFT como
identificador único. Carrinhos anteriores continuam associados à edição padrão.

Cotações incluem a edição e invalidam-se após mudança de preço ou estoque. A
liquidação revalida e decrementa apenas a edição comprada. O recibo preserva seu
nome, preço e quantidade; outras edições ou quantidades adicionadas depois da
compra permanecem no carrinho. A precisão monetária continua baseada em BigInt.

`POST /api/demo/edition-update` recebe `{ nftId, editionId, price?, available? }`,
persiste a alteração e transmite `nft.updated`. Carrinho e detalhe reconciliam via
REST; checkout exige nova revisão. Preços são strings decimais com até 18 casas,
e estoque é um inteiro não negativo. Edição inexistente retorna 404; valores
inválidos, 422.


## Redes simuladas

Ethereum, Polygon e Solana participam dos filtros, cadastro de carteiras e compra.
A carteira deve corresponder à rede de todos os NFTs do pedido. O endereço
secundário opcional é validado na mesma rede, tanto no formulário quanto na API.
Ethereum/Polygon usam endereço hexadecimal de 20 bytes; Solana usa Base58 que
decodifica exatamente 32 bytes, preservando maiúsculas e minúsculas na comparação.
Referência: https://solana.com/docs/core/accounts/account-structure.

Os valores do marketplace continuam expressos em ETH como determina o enunciado,
inclusive quando a rede simulada é Solana. Não há conversão para SOL, envio para
blockchain ou taxa real de rede. A referência de transação é um identificador
fictício do pedido e não corresponde a um hash verificável em exploradores.
