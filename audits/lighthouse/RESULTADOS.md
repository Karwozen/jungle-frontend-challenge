# Auditoria Lighthouse

Em 05/11/2026, com build de produção local, mocks habilitados e Chromium do
Playwright, foram feitas três medições por página e perfil. A tabela apresenta as
medianas do build com carregamento antecipado dos módulos, em `2026-11-05T22-42-13-168Z/`. Os relatórios completos em HTML e JSON e o ambiente estão nessa pasta.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 82 | 100 | 100 | 100 | 3,69 s | 0,0006 | 316 ms |
| Início | Desktop | 99 | 100 | 100 | 100 | 0,87 s | 0,0012 | 18 ms |
| Detalhe | Mobile | 83 | 100 | 100 | 100 | 3,66 s | 0,0237 | 294 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 0,87 s | 0,0382 | 0 ms |

A meta de performance 90 ainda não foi atingida no mobile. Em relação à rodada
anterior (79 no início e 83 no detalhe), o LCP caiu de 3,88 s para 3,69 s no
início e de 4,06 s para 3,66 s no detalhe. O bloqueio da thread principal ainda
pesa na nota e aumentou no detalhe. O build antecipa o download dos módulos
de inicialização, evita inicializar contas fictícias para visitantes sem token e
usa a latência configurável do mock em vez de um atraso fixo no catálogo.
Os mocks e os cenários permanecem ativos durante a auditoria.

Para reproduzir: `npm ci`, instalar o Chromium do Playwright se necessário e
executar `npm run audit:lighthouse`, com a porta 4173 livre e sem outras cargas
concorrentes. Consulte `DEVELOPMENT.md` para detalhes.
