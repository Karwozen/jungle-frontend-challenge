# Auditoria Lighthouse

Em 05/11/2026, com build de produção local, mocks habilitados e Chromium do
Playwright, foram feitas três medições por página e perfil. A tabela apresenta as
medianas do build com o novo layout. Os relatórios HTML e JSON e os dados do
ambiente estão em `2026-11-06T00-31-56-310Z/` (data e hora em UTC).

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 80 | 100 | 100 | 100 | 3,84 s | 0,0003 | 357 ms |
| Início | Desktop | 99 | 100 | 100 | 100 | 0,91 s | 0,0012 | 5 ms |
| Detalhe | Mobile | 85 | 100 | 100 | 100 | 3,81 s | 0,0208 | 224 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 0,88 s | 0,0382 | 0 ms |

A meta de performance 90 ainda está aberta no mobile. Em relação à auditoria
anterior (82 no início e 83 no detalhe), o início aumentou 0,15 s no LCP e
41 ms no bloqueio da thread principal. No detalhe, o bloqueio caiu 70 ms e
o LCP aumentou 0,15 s. O build carrega as artes, as fontes e os mocks reais da
demonstração.

Para reproduzir: `npm ci`, instalar o Chromium do Playwright se necessário e
executar `npm run audit:lighthouse`, com a porta 4173 livre e sem outras cargas
concorrentes. Consulte `DEVELOPMENT.md` para detalhes.
