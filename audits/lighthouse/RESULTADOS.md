# Auditoria Lighthouse

Em 05/11/2026, com build de produção local, mocks habilitados e Chromium do
Playwright, foram feitas três medições por página e perfil. A tabela apresenta as
medianas do build atual, em `2026-11-05T18-24-58-555Z/`; os relatórios completos
em HTML e JSON e o ambiente estão nessa pasta.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 83 | 100 | 100 | 100 | 3,88 s | 0,0006 | 269 ms |
| Início | Desktop | 99 | 100 | 100 | 100 | 0,94 s | 0,0012 | 5 ms |
| Detalhe | Mobile | 84 | 100 | 100 | 100 | 4,02 s | 0,0237 | 195 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 0,97 s | 0,0382 | 0 ms |

A meta de performance 90 ainda não foi atingida no mobile. Os relatórios apontam
descoberta tardia da imagem principal e JavaScript não utilizado entre as
oportunidades de investigação; os mocks permanecem ativos na demonstração. Uma
tentativa anterior de antecipar a imagem apresentou desempenho inferior e foi
revertida; relatórios históricos adicionais foram mantidos localmente.

Para reproduzir: `npm ci`, instalar o Chromium do Playwright se necessário e
executar `npm run audit:lighthouse`, com a porta 4173 livre e sem outras cargas
concorrentes. Consulte `DEVELOPMENT.md` para detalhes.
