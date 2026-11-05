# Referência visual

Fonte: arquivo [Frontend Challenge no Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1), página Marketplace de NFTs GreenMint.
Os valores a seguir foram inspecionados no painel de propriedades em novembro de
2026. A implementação ainda precisa de revisão comparativa completa.

## Valores confirmados

| Camada | Node ID | Propriedade | Valor |
| --- | --- | --- | --- |
| Desktop / Início | 2:2 | Largura | 1440 px fixa |
| Desktop / Início | 2:2 | Altura | 3668 px, envolver conteúdo |
| Desktop / Início | 2:2 | Padding superior/inferior | 24 px |
| Desktop / Início | 2:2 | Padding esquerdo/direito | 120 px |
| Desktop / Início | 2:2 | Espaço entre seções | 96 px |
| Desktop / Início | 2:2 | Color/Ink | #140D0A |
| Top | 70353:242 | Largura | 1200 px, preencher |
| Top | 70353:242 | Altura | 527 px, envolver |
| Top | 70353:242 | Espaço entre filhos | 32 px |
| Hero | 70347:239 | Fluxo | Horizontal |
| Hero | 70347:239 | Largura | 1200 px |
| Hero | 70347:239 | Altura | 450 px fixa |
| Hero | 70347:239 | Padding esquerdo | 40 px |
| Products | 70342:2831 | Fluxo | Horizontal |
| Products | 70342:2831 | Largura | 1200 px, preencher |
| Products | 70342:2831 | Altura | 1373 px, envolver |
| Products | 70342:2831 | Espaço entre filhos | 48 px |
| Product Grid | 70342:2830 | Fluxo | Vertical |
| Product Grid | 70342:2830 | Largura | 842 px, preencher |
| Product Grid | 70342:2830 | Espaço entre linhas | 88 px |
| NFT Artwork 03 | 4:137 | Imagem do card | 250 × 250 px; raio 15 px |
| Emerald Ape #042 | 4:165 | Texto do nome | 16 px, peso 400, linha 16 px |
| Emerald Ape #042 | 4:165 | Color/Foreground | #F5F1EB |
| Preço do NFT | 4:166 | Texto do preço | 18 px, peso 700, linha 16 px |
| Preço do NFT | 4:166 | Text/Accent | #E89B55 |
| Mobile / Início | 14:5226 | Frame | 414 × 896 px |
| Mobile / Início | 14:5226 | Padding superior | 40 px |
| Mobile / Início | 14:5226 | Padding lateral | 24 px |
| Mobile / Início | 14:5226 | Espaço entre filhos | 16 px |


## Assets e tipografia

Emerald Ape, Sage Nomad, Neon Vessel e Golden Beat usam artes exportadas do Figma,
com variantes WebP locais. A família tipográfica aparece no Figma como
`font/family`, sem resolução confirmada; IBM Plex Mono é uma substituição local.
O título principal observado usa 43 px, peso 700 e altura de linha 70 px.

## Detalhe e galeria

O frame desktop de detalhe (10:244) mede 1440 × 2246 px, com margens laterais
de 120 px e fundo #140D0A. Quatro miniaturas de 100 × 100 px apontam ao mesmo
asset do Emerald (hash `8459204731e6eba9d474cbc8ebc37071360d3ba5`). A galeria
as reproduz e suporta imagens distintas quando fornecidas. O frame mobile de
detalhe (15:5536) mede 414 × 896 px e mostra uma imagem principal sem miniaturas.
As opções de edição observadas são 1/1, 1/10, 1/50 e Aberta.

## Comentários e pendências

Comentários de colaboradores sugerem alinhar os grids dos frames 206, 230 e 231,
usando o 206 como padrão, e acrescentar backdrop ao diálogo de autenticação. O
comentário sobre WalletConnect ainda requer comparação com o frame de pagamento
mobile. Não reproduzir marcadores ou avatares de comentários como elementos da UI.
A posição de controles, texto, espaçamento, tipografia e fidelidade das demais
telas seguem em revisão. Os snapshots Playwright registram a versão implementada,
sem certificar correspondência integral ao Figma.
