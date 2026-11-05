# Acompanhamento do desafio

Referência: README original em https://github.com/junglegaming/frontend-challenge.
Este documento distingue implementação de comprovação. Parcial não significa aprovado.

| Seção do enunciado | Situação e evidência | Pendências |
| --- | --- | --- |
| 1. Escopo | Catálogo, conta, carrinho, checkout e pedido simulados | Concluir interações de detalhe e revisão visual |
| 2. Stack | React/TS, Router/Query, Axios, Tailwind/shadcn, MSW, Socket.IO e Playwright efetivos | Lighthouse executado; repetir no build final |
| 3. Telas e fluxos | Busca/URL, filtros de preço e rede (Ethereum/Polygon/Solana), carrinho, conta, carteiras, favoritos e compra implementados; galeria do Emerald conforme as quatro camadas do Figma; edições integradas ao estoque e recibo | Revisão de campos do Figma; outras vistas dependem de assets fornecidos |
| 4. Integração e estado | Consultas por identidade, cancelamento, invalidação, recuperação de pedido e favorito otimista com rollback | Cobertura ampliada de falhas |
| 5. Contratos REST | Conta, catálogo, carrinho, cotação, pedidos e favoritos tipados | Documentados em API_CONTRACTS.md; validar contratos finais |
| 6. MSW | Persistência, reset, dois usuários, preço alterado, pagamento recusado e timeout | Painel /demo/scenarios e API de rede implementados; consolidar cobertura final |
| 7. Socket.IO | nft.updated; order.updated autenticado, comparação de versões, consulta REST na reconexão e polling complementar | Eventos antigos e duplicados de NFT, interrupção e reconexão verificados via Socket.IO |
| 8. Interface e acessibilidade | Assets locais, shimmer, labels e foco básico; catálogo em 390/768/1440 | Fidelidade de todas as telas; assets/fonte provisórios; erros por campo, teclado, foco e zoom |
| 9. Playwright | Suíte desktop/mobile; compra, recusa, timeout, idempotência e oito referências visuais Windows | Outros sistemas precisam de baselines; demais cenários obrigatórios |
| 10. Lighthouse | Auditoria automatizada, 12 medições, relatórios HTML/JSON e medianas de notas, LCP/CLS/TBT | Performance mobile medida em 83/84 ainda abaixo de 90; medição anterior à inclusão do cenário de replay; ver audits/lighthouse/RESULTADOS.md |
| 11. Avaliação | Nenhuma nota ou conformidade integral presumida | Auditar cada critério eliminatório na versão final |
| 12. Entrega | Código, lockfile, assets, mocks locais, README da solução e ARCHITECTURE.md | Deploy público |

O Figma é a referência obrigatória e a revisão
visual de todas as telas está em andamento. As baselines registram o estado atual, não aprovação visual.
Substituições atuais estão em DESIGN_REFERENCE.md. Testes existentes não comprovam
fidelidade visual integral nem metas de acessibilidade/performance.
