import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import axios from 'axios'
import { api } from '../../shared/api'
import { profileSchema, passwordSchema, walletSchema, type User, type Wallet } from '../../shared/account'
import { queryClient } from '../../app/query'
import { Button } from '../../components/ui/button'
import { ImageIcon } from 'lucide-react'
import { PasswordInput } from '../../components/PasswordInput'
const message = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || 'Falha de conexão. Tente novamente.' : 'Não foi possível salvar.'
function Feedback({ error, success }: { error: unknown; success: boolean }) { return error ? <p role="alert" className="field-error">{message(error)}</p> : success ? <p role="status">Alterações salvas.</p> : null }
export function ProfileEditor({ user, walletsOnly = false }: { user: User; walletsOnly?: boolean }) {
  const avatarInput = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState(user.avatar || '')
  const [fileError, setFileError] = useState('')
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [formKey, setFormKey] = useState(0)
  const key = ['private', user.id, 'wallets']
  const wallets = useQuery({ queryKey: key, queryFn: async ({ signal }) => (await api.get<Wallet[]>('/wallets', { signal })).data })
  const profile = useMutation({ mutationFn: (data: unknown) => api.patch<User>('/profile', data), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['private', user.id, 'profile'] }); await queryClient.invalidateQueries({ queryKey: ['session'] }) } })
  const password = useMutation({ mutationFn: (data: unknown) => api.post('/password', data) })
  const wallet = useMutation({ mutationFn: (data: unknown) => editing ? api.patch(`/wallets/${editing.id}`, data) : api.post('/wallets', data), onSuccess: async () => { setEditing(null); setFormKey(value => value + 1); await queryClient.invalidateQueries({ queryKey: key }) } })
  const [validation, setValidation] = useState('')
  const [passwordValidation, setPasswordValidation] = useState('')
  const [walletValidation, setWalletValidation] = useState('')
  return <>
    {!walletsOnly && <>
    <form className="profile-form" key={user.email} onSubmit={event => { event.preventDefault(); setValidation(''); const data = Object.fromEntries(new FormData(event.currentTarget)); const parsed = profileSchema.safeParse({ ...data, avatar }); if (!parsed.success) { setValidation(parsed.error.issues[0].message); return } profile.mutate(parsed.data) }}>
      <div className="profile-fields">
      <div className="form-field"><label htmlFor="profile-name">Nome de exibição<span aria-hidden="true">*</span></label><input aria-label="Nome" id="profile-name" name="name" defaultValue={user.name} required minLength={2}/></div>
      <div className="form-field"><label htmlFor="profile-username">Nome de usuário</label><input id="profile-username" name="username" defaultValue={user.username || ''} pattern="[a-zA-Z0-9_.-]*" maxLength={40}/></div>
      <div className="form-field"><label htmlFor="profile-email">E-mail<span aria-hidden="true">*</span></label><input aria-label="E-mail" id="profile-email" name="email" type="email" defaultValue={user.email} required/></div>
      <div className="form-field"><label htmlFor="profile-ens">Nome ENS</label><div className="ens-field"><span>.eth</span><input id="profile-ens" name="ens" defaultValue={user.ens || ''} maxLength={100}/></div></div>
      <div className="form-field"><label htmlFor="profile-wallet-label">Apelido da carteira</label><input id="profile-wallet-label" name="walletLabel" defaultValue={user.walletLabel || ''} maxLength={50}/></div>
      <div className="form-field profile-avatar-field"><span>Avatar</span><div className="avatar-controls">{avatar ? <img src={avatar} alt="Avatar do perfil" width={48} height={48} className="profile-avatar"/> : <span className="avatar-placeholder"><ImageIcon size={23}/></span>}
      <label htmlFor="profile-avatar" className="sr-only">Avatar (PNG, JPEG ou WebP, até 1 MB)</label><input ref={avatarInput} id="profile-avatar" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby={fileError ? 'avatar-error' : undefined} aria-invalid={Boolean(fileError)} onChange={event => { const file = event.target.files?.[0]; setFileError(''); if (!file) return; if (file.size > 1024 * 1024 || !['image/png','image/jpeg','image/webp'].includes(file.type)) { setFileError('Escolha PNG, JPEG ou WebP com até 1 MB.'); event.target.value = ''; return } const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.onerror = () => setFileError('Não foi possível ler a imagem.'); reader.readAsDataURL(file) }}/><Button type="button" onClick={() => avatarInput.current?.click()}>Alterar</Button><Button type="button" variant="ghost" aria-label="Remover avatar" onClick={() => { setAvatar(''); setFileError(''); if (avatarInput.current) avatarInput.current.value = '' }}>Remover</Button></div>{fileError && <p id="avatar-error" role="alert" className="field-error">{fileError}</p>}</div>
      </div>
      {validation && <p role="alert" className="field-error">{validation}</p>}<Feedback error={profile.error} success={profile.isSuccess}/><Button type="submit" disabled={profile.isPending || Boolean(fileError)}>Salvar perfil</Button>
    </form>
    <section className="profile-password"><h2>Alterar senha</h2><form onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); const parsed = passwordSchema.safeParse(data); if (!parsed.success) { setPasswordValidation(parsed.error.issues[0].message); return } if (data.newPassword !== data.confirmPassword) { setPasswordValidation('As senhas não coincidem.'); return } setPasswordValidation(''); password.mutate(parsed.data, { onSuccess: () => form.reset() }) }}>
      <div className="form-field"><label htmlFor="currentPassword">Senha atual</label><PasswordInput id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required/></div><div className="form-field"><label htmlFor="newPassword">Nova senha</label><PasswordInput id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required/></div><div className="form-field"><label htmlFor="confirmPassword">Confirmar nova senha</label><PasswordInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required/></div>{passwordValidation && <p role="alert" className="field-error">{passwordValidation}</p>}<Feedback error={password.error} success={password.isSuccess}/><Button disabled={password.isPending}>Alterar senha</Button>
    </form></section>
    </>}
    {walletsOnly && <section className="wallets-section" id="wallets"><p>Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>{wallets.isPending ? <div className="skeleton h-20"/> : wallets.isError ? <p role="alert">Não foi possível carregar suas carteiras.</p> : <ul>{wallets.data.map(item => <li key={item.id} className="wallet-item"><strong>{item.label}{item.primary ? ' · Principal' : ' · Secundária'}</strong><p>{item.network} · {item.address}</p><Button variant="ghost" onClick={() => { setEditing(item); setFormKey(value => value + 1); wallet.reset() }}>Editar {item.label}</Button></li>)}</ul>}
      {(editing || (wallets.data && wallets.data.length < 2)) && <form className="wallet-form" key={formKey} onSubmit={event => { event.preventDefault(); const form = event.currentTarget, data = new FormData(form); const parsed = walletSchema.safeParse({ ...Object.fromEntries(data), primary: data.has('primary') }); if (!parsed.success) { setWalletValidation(parsed.error.issues[0].message); return } setWalletValidation(''); wallet.mutate(parsed.data) }}><h3>{editing ? 'Editar carteira' : wallets.data?.length ? 'Carteira secundária' : 'Adicionar carteira'}</h3><div className="wallet-fields">
      <div className="form-field"><label htmlFor="wallet-display-name">Nome de exibição</label><input id="wallet-display-name" name="displayName" defaultValue={editing?.displayName || user.name} maxLength={100}/></div>
      <div className="form-field"><label htmlFor="wallet-label">Apelido da carteira<span aria-hidden="true">*</span></label><input id="wallet-label" aria-label="Nome da carteira" name="label" defaultValue={editing?.label} required minLength={2}/></div>
      <div className="form-field"><label htmlFor="wallet-network">Rede<span aria-hidden="true">*</span></label><select aria-label="Rede" id="wallet-network" name="network" defaultValue={editing?.network || 'Ethereum'}><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></div>
      <div className="form-field"><label htmlFor="wallet-profile-name">Nome do perfil</label><input id="wallet-profile-name" name="profileName" defaultValue={editing?.profileName || user.name} maxLength={100}/></div>
      <div className="form-field"><label htmlFor="wallet-address">Endereço da carteira<span aria-hidden="true">*</span></label><input aria-label="Endereço da carteira" id="wallet-address" name="address" placeholder="Endereço da carteira" defaultValue={editing?.address} required/></div>
      <div className="form-field"><label className="sr-only" htmlFor="wallet-secondary">ENS ou carteira secundária (opcional)</label><input id="wallet-secondary" name="secondaryAddress" placeholder="ENS ou carteira secundária (opcional)" defaultValue={editing?.secondaryAddress || ''} maxLength={100}/></div>
      <div className="form-field"><label htmlFor="wallet-provider">Tipo de carteira<span aria-hidden="true">*</span></label><select id="wallet-provider" name="provider" defaultValue={editing?.provider || 'MetaMask'}><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></div>
      <div className="form-field"><label htmlFor="wallet-referral">Código de indicação</label><input id="wallet-referral" name="referralCode" defaultValue={editing?.referralCode || ''} maxLength={40}/></div>
      <div className="form-field"><label htmlFor="wallet-email">E-mail</label><input id="wallet-email" name="email" type="email" defaultValue={editing?.email || user.email}/></div>
      <div className="form-field"><label htmlFor="wallet-ens">Nome ENS</label><div className="ens-field"><span>.eth</span><input id="wallet-ens" name="ens" defaultValue={editing?.ens || ''} maxLength={100}/></div></div>
      </div><label><input type="checkbox" name="primary" defaultChecked={editing?.primary} className="wallet-checkbox"/> Carteira principal</label>{walletValidation && <p role="alert" className="field-error">{walletValidation}</p>}<Feedback error={wallet.error} success={wallet.isSuccess}/><div className="mt-4"><Button disabled={wallet.isPending}>Salvar carteira</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setFormKey(value => value + 1) }}>Cancelar edição</Button>}</div></form>}
    </section>}
  </>
}
