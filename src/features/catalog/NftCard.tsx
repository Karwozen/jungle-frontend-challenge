import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { Nft } from '../../shared/contracts'
import { FavoriteButton } from './FavoriteButton'
import { Artwork } from './Artwork'
export function NftCard({ nft, showFavorite = false }: { nft: Nft; showFavorite?: boolean }) {
  return <li className="nft-card"><Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="nft-card-link"><div className="nft-card-image"><Artwork nft={nft}/><span className="artwork-open" aria-hidden="true"><ArrowUpRight size={19}/></span>{!nft.available && <span className="sold-out-badge">Esgotado</span>}</div><div className="nft-card-meta"><p className="nft-collection-name">{nft.collection}</p><h2>{nft.name}</h2><div className="nft-card-price"><span>{nft.price} ETH</span><span className="edition-count">{nft.available ? `${nft.available} edições` : 'Indisponível'}</span></div></div></Link>{showFavorite && <FavoriteButton nftId={nft.id} compact/>}</li>
}
