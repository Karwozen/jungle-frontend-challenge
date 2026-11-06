# Auditoria Lighthouse

Mediana de 3 medições por página e perfil. Relatórios completos em `lighthouse/reports/` (HTML e JSON de cada medição).

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| inicio | mobile | 84 ⚠️ | 96 ✅ | 100 ✅ | 92 ✅ | 3835 ms | 0.016 | 75 ms |
| detalhe | mobile | 86 ⚠️ | 100 ✅ | 100 ✅ | 92 ✅ | 3591 ms | 0.001 | 26 ms |
| inicio | desktop | 99 ✅ | 96 ✅ | 100 ✅ | 92 ✅ | 868 ms | 0.000 | 0 ms |
| detalhe | desktop | 99 ✅ | 100 ✅ | 100 ✅ | 92 ✅ | 880 ms | 0.017 | 0 ms |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

## Ambiente e condições

- Data: 2026-10-23T08:12:56.963Z
- Lighthouse 12.8.2, Chrome/141.0.0.0, Node v20.19.4
- Sistema: Windows_NT 10.0.26300 (x64); CPU: 11th Gen Intel(R) Core(TM) i7-11800H @ 2.30GHz × 16; memória: 16 GB
- Aplicação: kurio-marketplace@1.0.0 (build de produção, vite preview, mocks ligados)
- Perfis: mobile (configuração padrão do Lighthouse: Moto G Power emulado, 4G simulado, CPU 4× mais lenta) e desktop (preset `desktop`)
- Cenário dos mocks: padrão (`default`), com latência simulada de 90 a 200 ms por requisição da API
- Um Chrome novo por medição, sem cache nem service worker da rodada anterior
- Imagens, fontes e funcionalidades da entrega carregadas normalmente; nenhuma simplificação para melhorar a nota
