# Auditoria Lighthouse

Em 05/11/2026, com build de produção local, mocks habilitados e Chromium do
Playwright, foram feitas três medições por página e perfil. A tabela apresenta as
medianas do build com navegação nos destaques, em `2026-11-05T22-30-10-127Z/`. Os relatórios completos em HTML e JSON e o ambiente estão nessa pasta.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 79 | 100 | 100 | 100 | 3,88 s | 0,0006 | 366 ms |
| Início | Desktop | 99 | 100 | 100 | 100 | 0,88 s | 0,0012 | 6 ms |
| Detalhe | Mobile | 83 | 100 | 100 | 100 | 4,06 s | 0,0237 | 223 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 0,97 s | 0,0382 | 0 ms |

A meta de performance 90 ainda não foi atingida no mobile. O início passou a
carregar somente a variante de 480 px do Emerald Ape nessa auditoria; a redução
de transferência não baixou o LCP, que continua associado ao primeiro card do
catálogo. Em relação à rodada de referência (83 no início e 84 no detalhe),
o tempo de bloqueio subiu. O carregamento inicial dos mocks e a renderização
do catálogo continuam como pontos de investigação.

Para reproduzir: `npm ci`, instalar o Chromium do Playwright se necessário e
executar `npm run audit:lighthouse`, com a porta 4173 livre e sem outras cargas
concorrentes. Consulte `DEVELOPMENT.md` para detalhes.
