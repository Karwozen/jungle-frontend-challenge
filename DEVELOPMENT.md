# Desenvolvimento

O projeto implementa o marketplace solicitado com dados simulados e utiliza o
Figma como referência. O cupom fictício é `KURIO10`. Consulte
`REQUIREMENTS_STATUS.md` para as pendências e limitações conhecidas.

## Estado atual

Os fluxos principais de descoberta, conta, carrinho, favoritos, checkout e pedido
simulado estão implementados. A busca, filtros, ordenação e paginação ficam na URL;
há 24 fixtures, acesso direto ao detalhe, estados de loading/erro e artes locais
originais do Figma. Perfil, avatar, senha, carteiras, cotação, pagamento confirmado/recusado,
timeout com recuperação e idempotência estão disponíveis. Consulte
`ARCHITECTURE.md`, `CHECKOUT.md` e `REQUIREMENTS_STATUS.md`.

## Executar

Requer Node.js 24 e npm. Instalar com `npm ci`, iniciar com `npm run dev:mocks`.
Abrir http://127.0.0.1:5173/demo/foundation para verificar REST e Socket.IO.

`npm run build` gera dist; `npm run preview` serve a versão compilada.
`npm run typecheck`, `npm run lint` e `npm test` verificam tipos, lint e dinheiro.
`npm run test:e2e` executa Chromium desktop e mobile. Se necessário, instalar o
browser com `npx playwright install chromium`. `npm run test:e2e:report` abre o
relatório HTML em `playwright-report/`, que deve acompanhar a entrega. Traces
ficam em `test-results/` quando um teste falha e precisam ser anexados à entrega
se houver falhas a relatar.

`npm run audit:lighthouse` gera build otimizado e executa três medições por página
(início e detalhe) e perfil (mobile e desktop), com mocks habilitados e navegador
Chromium instalado pelo Playwright. Os relatórios HTML/JSON e as medianas de notas,
LCP, CLS e TBT são escritos em uma nova pasta dentro de `audits/lighthouse/`. É
possível definir `CHROME_PATH` para usar outro Chromium. A porta 4173 deve estar
livre. As auditorias devem ser feitas sem outras cargas concorrentes.

Mocks são habilitados por padrão também no build de demonstração. A variável
`VITE_ENABLE_MOCKS=false` desabilita a simulação; ainda não existe backend real.
Não usar credenciais pessoais nesta demonstração.

## Regressão visual

`tests/e2e/visual-baseline.spec.ts` compara a área visível de início, detalhe e
carrinho em desktop e mobile. As seis referências versionadas foram capturadas
no Chromium do Playwright para Windows; em outros sistemas os testes visuais são
ignorados até haver referências próprias, pois a renderização de fontes varia.
Para executar: `npm run test:e2e -- tests/e2e/visual-baseline.spec.ts`. Após revisar
uma mudança visual intencional, `npm run test:e2e -- tests/e2e/visual-baseline.spec.ts --update-snapshots`
atualiza as referências. Essas imagens registram o estado atual da aplicação;
não comprovam que ela já corresponde integralmente ao Figma.

## Fundação de dados

- GET /api/nfts: q, collection, sort (recent/price-asc/price-desc), page; nove itens
  por página. A fixture define a ordem inicial de recent até introduzir datas.
- GET /api/nfts/:id: detalhe ou 404.
- POST /api/demo/reset: restaura fixtures.
- POST /api/demo/nft-update: aumenta o preço do primeiro NFT em 0.05 ETH, incrementa
  a versão, persiste e transmite nft.updated para clientes conectados.

O banco fica na chave localStorage kurio.mock.database.v2. A chave mudou para
inicializar o catálogo ampliado. Testes Playwright usam
contextos novos e isolados, sem compartilhar esse armazenamento.

## Verificação de falhas e reconexão — 05/11/2026

Build, lint e a suíte completa passaram: 79 testes aprovados e três ignorados
por serem específicos de outro layout. Inclui configuração persistente de rede,
respostas fora de ordem, erro HTTP recuperável, preservação do carrinho em falha
e timeout, reconexão real do Socket.IO e recuperação de pedido pendente após
interrupção e erros temporários de leitura. Consulte MOCK_SCENARIOS.md.
Eventos antigos/duplicados ainda precisam de cenários dedicados; esses testes
não representam uma auditoria final de todos os critérios do enunciado.

## Cuidados de integração encontrados

@mswjs/socket.io-binding 0.2.0 exporta toSocketIo; a API da branch principal do
repositório difere. O lockfile fixa a árvore de dependências validada.
MSW normaliza /socket.io/ na correspondência da URL do handler. Carregar o módulo
que importa Socket.IO somente depois de worker.start evita capturar WebSocket
antes da instalação do interceptor. O binding publicado inicializa handshake;
o handler mantém o heartbeat Engine.IO e limpa timers na desconexão.

Os eventos contêm `eventId`, `resourceId`, `version` e `data`. O pedido usa
inscrição autenticada e valida recurso, usuário e versão; catálogo e carrinho
reconciliam via REST na reconexão. Os controles de falha estão documentados em
`MOCK_SCENARIOS.md`. Testes de eventos antigos e duplicados seguem pendentes.

## Instalação isolada

Em 05/11/2026, uma cópia sem `node_modules`, build, históricos de auditoria e
artefatos temporários passou por `npm ci`, build e três testes unitários. Oito
testes selecionados de checkout, recuperação, carrinho e visual passaram usando
porta local alternativa. O `npm audit --omit=dev` não apontou vulnerabilidades
de produção; `npm ci` reportou sete moderadas no conjunto de desenvolvimento.
A cópia não equivale a um checkout Git remoto, pois o
repositório de entrega ainda não foi publicado.
