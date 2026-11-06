import type { Wallet } from '../../shared/account'
export function CollectorFields({ draft, errors, wallet, network, onNetworkChange }: { draft: Record<string, string>; errors: Record<string, string>; wallet?: Wallet; network: string; onNetworkChange: () => void }) {
  return <div className="collector-grid">
    <div className="form-field collector-network"><label htmlFor="checkout-network">Rede</label><select key={network} aria-label="Rede de pagamento" id="checkout-network" name="network" defaultValue={network} onChange={onNetworkChange}><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></div>
    <div className="form-field collector-wallet-address"><label htmlFor="collector-wallet-address">Endereço da carteira</label><input id="collector-wallet-address" value={wallet?.address || ''} readOnly placeholder="Selecione uma carteira"/></div>
    <div className="form-field collector-wallet-type"><label htmlFor="collector-wallet-type">Tipo de carteira</label><input id="collector-wallet-type" readOnly value={draft.walletType || 'WalletConnect'}/></div>
    {[
    ['username', 'Nome de usuário', true], ['profileName', 'Nome do perfil', true],
    ['invitationCode', 'Código de indicação', true], ['lnsName', 'Nome ENS', true],
    ['secondaryAddress', 'Endereço da carteira secundária (opcional)', false],
  ].map(([name, label, required]) => <div className="form-field" key={String(name)}><label htmlFor={`collector-${name}`}>{label}</label><input id={`collector-${name}`} aria-label={name === 'lnsName' ? 'Nome LNS' : undefined} name={String(name)} defaultValue={draft[String(name)] || ''} required={Boolean(required)} aria-invalid={Boolean(errors[String(name)])} aria-describedby={errors[String(name)] ? `${name}-error` : undefined}/>{errors[String(name)] && <p id={`${name}-error`} className="field-error" role="alert">{errors[String(name)]}</p>}</div>)}
    <div className="form-field collector-note"><label htmlFor="collector-note">Observação do colecionador (opcional)</label><textarea id="collector-note" name="note" defaultValue={draft.note || ''} maxLength={1000}/></div>
  </div>
}

export function WalletProviders({ draft }: { draft: Record<string, string> }) {
  return <fieldset className="checkout-provider-options"><legend>Tipo de carteira</legend>{['WalletConnect', 'MetaMask', 'Coinbase Wallet'].map(provider => <label className="checkout-option" key={provider}><input type="radio" name="walletType" value={provider} defaultChecked={provider === (draft.walletType || 'WalletConnect')}/><span className="provider-medallion" aria-hidden="true">{provider === 'WalletConnect' ? 'W' : provider === 'MetaMask' ? 'M' : 'C'}</span><span>{provider}</span></label>)}</fieldset>
}
