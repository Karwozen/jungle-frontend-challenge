import { Link } from '@tanstack/react-router'
import { Button } from '../../components/ui/button'

const editorial = [
  { artwork: 'neon-vessel', title: 'Como funciona a propriedade de NFTs' },
  { artwork: 'emerald-ape', title: '10 artistas digitais para acompanhar' },
  { artwork: 'sage-nomad', title: 'Raridade, atributos e procedência' },
  { artwork: 'golden-beat', title: 'Como proteger sua carteira' },
]

export function HomeSections() {
  return <>
    <section className="home-promos" aria-label="Destaques do mercado">
      <article><img src="/assets/art/emerald-ape-480.webp" alt="Emerald Ape da coleção Original Apes" width={480} height={480} loading="lazy"/><div><h2>Lançamentos gênesis de edição limitada</h2><Button asChild><Link to="/nfts/$nftId" params={{ nftId: 'emerald-ape-42' }}>Explorar</Link></Button></div></article>
      <article><img src="/assets/art/neon-vessel-480.webp" alt="Neon Vessel da coleção Original Apes" width={480} height={480} loading="lazy"/><div><h2>Arte digital selecionada e muito mais</h2><Button asChild><Link to="/nfts/$nftId" params={{ nftId: 'neon-vessel-52' }}>Explorar</Link></Button></div></article>
    </section>
    <section className="home-editorial" aria-labelledby="editorial-title"><h2 id="editorial-title">Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores, artistas e curiosos da propriedade digital.</p><div className="editorial-grid">{editorial.map(item => <article key={item.artwork}><img src={`/assets/art/${item.artwork}-480.webp`} alt="" width={480} height={480} loading="lazy"/><div><h3>{item.title}</h3></div></article>)}</div></section>
  </>
}
