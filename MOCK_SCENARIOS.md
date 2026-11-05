# Cenários reproduzíveis

Abra `/demo/scenarios` com os mocks habilitados. O painel é exclusivo da
demonstração e não faz parte das telas comerciais do Figma. A condição de rede
ativa é exibida no painel e persiste em localStorage. Restaurar a rede não apaga
conta, carrinho ou pedidos. `/api/demo/reset` restaura também as fixtures.

## Rede

`POST /api/demo/network-scenario` configura `{ mode, scope?, method?, delays?, remaining? }`.
`GET /api/demo/network-scenario` consulta o estado ativo e o cursor da sequência.

- `normal`: funcionamento habitual.
- `offline`: falha de conexão MSW, sem executar o handler de negócio.
- `server-error`: resposta HTTP 503, sem executar a operação.
- `slow`: espera a próxima latência da sequência `delays` antes do handler normal.
- `timeout`: espera 13 segundos e falha antes de processar. Axios expira em 12.

`scope` é um prefixo de rota em `/api`, com limite de segmento, e `method` é `*`,
GET, POST, PATCH, PUT ou DELETE. `delays` é uma lista cíclica de inteiros entre 0
e 10000 ms; o padrão é `[1200,100]`. A sequência é determinística por ordem de
chegada das requisições. `remaining` limita quantas serão afetadas; `null` é
contínuo e 0 já está esgotado. As requisições não correspondentes passam normalmente.
Os controles `/api/demo/*` ficam excluídos das falhas para permitir recuperação.

Para avaliar preservação do carrinho, adicione um NFT e configure `offline`,
rota `/api/cart`, método PATCH, limite 1. A primeira alteração falha e mantém os
itens; repetir a alteração funciona. Troque o modo para `timeout` para avaliar o
mesmo fluxo com expiração anterior ao processamento.

Para falha de leitura, configure `server-error` na rota exata do detalhe, como
`/api/nfts/emerald-ape-42`. Abra o NFT, observe o erro, restaure a rede no painel e
use Tentar novamente. A recuperação preserva a rota.

## Pagamento e tempo real

O painel usa `/api/demo/payment-scenario` com `success`, `declined` ou `timeout`.
O timeout de pagamento cria o pedido antes de atrasar a resposta; difere do
timeout de rede. O checkout recupera essa tentativa com a mesma chave de idempotência.

`POST /api/demo/socket-disconnect` aceita `{ pauseMs: 3500 }` (0 a 10000 ms),
encerra os WebSockets ativos e rejeita conexões durante a pausa. O cliente real
Socket.IO tenta reconectar; os recursos consultam REST para reconciliar o estado.
`GET /api/demo/realtime-status` mostra clientes ativos e conexões aceitas desde o
carregamento do módulo. Nenhuma dessas ações chama setters do React ou do cache.

No checkout, a reconexão invalida a revisão para exigir nova confirmação dos
valores. No acompanhamento do pedido, a consulta REST e o polling recuperam o
resultado mesmo se um evento de confirmação tiver sido perdido.

Verificação: `npm run test:e2e -- tests/e2e/resilience.spec.ts` e o cenário
"pedido pendente recupera" em `checkout.spec.ts`. As simulações não equivalem
a indisponibilidade real da internet e não sincronizam navegadores independentes.
