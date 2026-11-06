# Acompanhamento do desafio

Referência: [enunciado original](https://github.com/junglegaming/frontend-challenge).
Esta revisão distingue fluxos implementados de evidências ainda pendentes.

| Seção | Situação e evidência | Pendência |
| --- | --- | --- |
| 1–3. Escopo, stack e fluxos | Catálogo com busca, filtros, ordenação e paginação; detalhe com galeria, edição e favoritos; conta, carteiras, carrinho, checkout e recibo simulados. Stack obrigatória usada nos fluxos. | Início, detalhe, carrinho e pagamento revisados em desktop e mobile. Restam diferenças de conteúdo e composição documentadas. |
| 4–5. Estado e REST | Contratos tipados em [API_CONTRACTS.md](API_CONTRACTS.md). Consultas por identidade, cancelamento, invalidação, favorito otimista com rollback e pedido idempotente. | Conferir o mapa dos contratos antes do envio. |
| 6–7. Mocks e tempo real | MSW simula rede, sessão, preço, estoque e pagamento. Playwright cobre reconexão, retomada de pedido pendente e descarte de eventos antigos ou duplicados de NFT. | Verificar os cenários mais importantes no endereço público após a última publicação. |
| 8. Interface e acessibilidade | Artes locais do Figma, foco visível, navegação por teclado e verificações de diálogo. A auditoria recente marcou 100 em acessibilidade nas duas páginas auditadas. | Comparar manualmente as telas com o Figma e revisar foco, erros e zoom; a auditoria de duas páginas não cobre todo o app. |
| 9. Playwright | 87 execuções passaram e 3 específicas de viewport foram ignoradas na última suíte completa. Oito baselines no Chromium Windows cobrem início, detalhe, carrinho e pagamento. | Baselines visuais de outros sistemas não estão versionadas. |
| 10. Lighthouse | Três rodadas por página e perfil, build otimizado com mocks ativos e [resultados completos](audits/lighthouse/RESULTADOS.md). | Performance mobile 80 no início e 85 no detalhe, abaixo da meta 90. |
| 11. Avaliação | Os fluxos críticos exercitam REST e Socket.IO nos mocks; compra confirmada depende de resposta simulada e dados são isolados por usuário. | Revisão final de conformidade; a nota depende dos avaliadores. |
| 12. Entrega | [Repositório público](https://github.com/Karwozen/jungle-frontend-challenge), [deploy público](https://jungle-frontend-challenge-mocha.vercel.app/), instruções, lockfile, assets, testes e relatórios. | Verificar correspondência entre deploy e commit final e enviar os dois links à Jungle. |

O [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1)
continua sendo a referência visual. A [documentação de design](DESIGN_REFERENCE.md)
registra os valores conferidos, as substituições e o que ainda precisa de revisão.
As baselines registram regressões contra a implementação, não aprovação de
fidelidade ao Figma.
