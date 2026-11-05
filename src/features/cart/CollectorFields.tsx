export function CollectorFields({ draft, errors }: { draft: Record<string, string>; errors: Record<string, string> }) {
  return <div className="collector-grid">{[
    ['username', 'Nome de usuário', true], ['profileName', 'Nome do perfil', true],
    ['invitationCode', 'Código de indicação', true], ['lnsName', 'Nome LNS', true],
    ['secondaryAddress', 'Endereço da carteira secundária (opcional)', false],
  ].map(([name, label, required]) => <div className="form-field" key={String(name)}><label htmlFor={`collector-${name}`}>{label}</label><input id={`collector-${name}`} name={String(name)} defaultValue={draft[String(name)] || ''} required={Boolean(required)} aria-invalid={Boolean(errors[String(name)])} aria-describedby={errors[String(name)] ? `${name}-error` : undefined}/>{errors[String(name)] && <p id={`${name}-error`} className="field-error" role="alert">{errors[String(name)]}</p>}</div>)}
    <div className="form-field"><label htmlFor="wallet-type">Tipo de carteira</label><select id="wallet-type" name="walletType" defaultValue={draft.walletType || 'WalletConnect'}><option>WalletConnect</option><option>MetaMask</option><option>Coinbase Wallet</option></select></div>
    <div className="form-field collector-note"><label htmlFor="collector-note">Observação do colecionador (opcional)</label><textarea id="collector-note" name="note" defaultValue={draft.note || ''} maxLength={1000}/></div>
  </div>
}
