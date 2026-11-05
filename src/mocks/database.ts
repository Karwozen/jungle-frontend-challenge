import type { Nft } from '../shared/contracts'
import { parseEth, serializeEth } from '../shared/money'
const KEY = 'kurio.mock.database.v2'
interface Database { schema: 1; nfts: Nft[] }
function seed(): Database {
  return { schema: 1, nfts: [
    { id: 'emerald-ape-42', name: 'Emerald Ape #042', collection: 'Original Apes', price: '1.25', available: 5, version: 1, artwork: '/assets/art/emerald-ape', creator: 'KURIO Editions', description: 'Um colecionável digital da coleção Kurio Editions, criado para a comunidade de colecionadores.' },
    { id: 'sage-nomad-9', name: 'Sage Nomad #009', collection: 'Original Apes', price: '1.69', available: 8, version: 1, artwork: '/assets/art/sage-nomad' },
    { id: 'neon-vessel-52', name: 'Neon Vessel #052', collection: 'Original Apes', price: '1.99', available: 6, version: 1, artwork: '/assets/art/neon-vessel' },
    { id: 'golden-ape-18', name: 'Golden Beat #207', collection: 'Original Apes', price: '0.99', available: 3, version: 1, artwork: '/assets/art/golden-beat' },
  ].concat(Array.from({ length: 20 }, (_, i) => ({ id: `ape-${i + 100}`, name: `${['Cosmic Bloom', 'Violet Nomad', 'Ivory Baron', 'Golden Signal'][i % 4]} #${i + 100}`, collection: 'Original Apes', price: `${1 + Math.floor(i / 10)}.${(i * 7 % 100).toString().padStart(2, '0')}`, available: i % 7, version: 1, artwork: `/assets/art/${['sage-nomad', 'sage-nomad', 'neon-vessel', 'golden-beat'][i % 4]}` }))).map((nft, i) => ({ ...nft, gallery: nft.id === 'emerald-ape-42' ? [nft.artwork, nft.artwork, nft.artwork, nft.artwork] : [nft.artwork], network: i >= 4 && i % 3 === 0 ? 'Solana' : i % 2 ? 'Polygon' : 'Ethereum', editions: [{ id: 'standard', name: '1/50', price: nft.price, available: nft.available }, { id: 'numbered', name: '1/10', price: serializeEth(parseEth(nft.price) + parseEth('0.25')), available: Math.min(nft.available, 2) }, { id: 'collectors', name: '1/1', price: serializeEth(parseEth(nft.price) + parseEth('0.5')), available: 0 }, { id: 'open', name: 'Aberta', price: nft.price, available: nft.available }]  })) }
}
export function readDatabase(): Database {
  try { const raw = localStorage.getItem(KEY); if (raw) { const db = JSON.parse(raw) as Database; if (db.schema === 1 && Array.isArray(db.nfts)) {
    // Enrich existing fixtures without discarding prices changed by socket events.
    const metadata = new Map(seed().nfts.filter(nft => nft.artwork).map(nft => [nft.id, nft]))
    db.nfts = db.nfts.filter(nft => nft.collection !== 'Ecos do Olimpo').map(nft => { const source = metadata.get(nft.id); return source ? { ...nft, network: source.network, editions: source.editions.map(defaultEdition => { const stored = nft.editions?.find(item => item.id === defaultEdition.id); return stored ? { ...stored, name: defaultEdition.name } : defaultEdition }), artwork: source.artwork, gallery: nft.gallery ?? source.gallery, creator: source.creator, description: source.description } : nft })
    for (const nft of seed().nfts) if (!db.nfts.some(existing => existing.id === nft.id)) db.nfts.push(nft)
    return db
  } } } catch { /* Reset invalid demonstration data. */ }
  const db = seed(); writeDatabase(db); return db
}
export function writeDatabase(db: Database) { localStorage.setItem(KEY, JSON.stringify(db)) }
export function resetDatabase() { writeDatabase(seed()) }
