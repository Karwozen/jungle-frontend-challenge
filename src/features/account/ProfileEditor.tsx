import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import axios from 'axios'
import { api } from '../../shared/api'
import { profileSchema, passwordSchema, walletSchema, type User, type Wallet } from '../../shared/account'
import { queryClient } from '../../app/query'
import { Button } from '../../components/ui/button'
const message = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || 'Falha de conexão. Tente novamente.' : 'Não foi possível salvar.'
function Feedback({ error, success }: { error: unknown; success: boolean }) { return error ? <p role="alert" className="field-error">{message(error)}</p> : success ? <p role="status">Alterações salvas.</p> : null }
export function ProfileEditor({ user, walletsOnly = false }: { user: User; walletsOnly?: boolean }) {
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
    <form key={user.email} onSubmit={event => { event.preventDefault(); setValidation(''); const data = Object.fromEntries(new FormData(event.currentTarget)); const parsed = profileSchema.safeParse({ ...data, avatar }); if (!parsed.success) { setValidation(parsed.error.issues[0].message); return } profile.mutate(parsed.data) }}>
      {avatar && <img src={avatar} alt="Avatar do perfil" width={80} height={80} className="profile-avatar"/>}
      <div className="form-field"><label htmlFor="profile-name">Nome</label><input id="profile-name" name="name" defaultValue={user.name} required minLength={2}/></div>
      <div className="form-field"><label htmlFor="profile-email">E-mail</label><input id="profile-email" name="email" type="email" defaultValue={user.email} required/></div>
      <div className="form-field"><label htmlFor="profile-avatar">Avatar (PNG, JPEG ou WebP, até 1 MB)</label><input id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby={fileError ? 'avatar-error' : undefined} aria-invalid={Boolean(fileError)} onChange={event => { const file = event.target.files?.[0]; setFileError(''); if (!file) return; if (file.size > 1024 * 1024 || !['image/png','image/jpeg','image/webp'].includes(file.type)) { setFileError('Escolha PNG, JPEG ou WebP com até 1 MB.'); event.target.value = ''; return } const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.onerror = () => setFileError('Não foi possível ler a imagem.'); reader.readAsDataURL(file) }}/>{fileError && <p id="avatar-error" role="alert" className="field-error">{fileError}</p>}{avatar && <Button type="button" variant="ghost" onClick={() => setAvatar('')}>Remover avatar</Button>}</div>
      {validation && <p role="alert" className="field-error">{validation}</p>}<Feedback error={profile.error} success={profile.isSuccess}/><Button type="submit" disabled={profile.isPending || Boolean(fileError)}>Salvar perfil</Button>
    </form>
    <section className="nft-story"><h2>Alterar senha</h2><form onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); const parsed = passwordSchema.safeParse(data); if (!parsed.success) { setPasswordValidation(parsed.error.issues[0].message); return } if (data.newPassword !== data.confirmPassword) { setPasswordValidation('As senhas não coincidem.'); return } setPasswordValidation(''); password.mutate(parsed.data, { onSuccess: () => form.reset() }) }}>
      <div className="form-field"><label htmlFor="currentPassword">Senha atual</label><input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required/></div><div className="form-field"><label htmlFor="newPassword">Nova senha</label><input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required/></div><div className="form-field"><label htmlFor="confirmPassword">Confirmar nova senha</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required/></div>{passwordValidation && <p role="alert" className="field-error">{passwordValidation}</p>}<Feedback error={password.error} success={password.isSuccess}/><Button disabled={password.isPending}>Alterar senha</Button>
    </form></section>
    </>}
    {walletsOnly && <section className="wallets-section" id="wallets"><p>Cadastre até duas carteiras simuladas. A carteira principal será usada na revisão da compra.</p>{wallets.isPending ? <div className="skeleton h-20"/> : wallets.isError ? <p role="alert">Não foi possível carregar suas carteiras.</p> : <ul>{wallets.data.map(item => <li key={item.id} className="wallet-item"><strong>{item.label}{item.primary ? ' · Principal' : ' · Secundária'}</strong><p>{item.network} · {item.address}</p><Button variant="ghost" onClick={() => { setEditing(item); setFormKey(value => value + 1); wallet.reset() }}>Editar {item.label}</Button></li>)}</ul>}
      {(editing || (wallets.data && wallets.data.length < 2)) && <form key={formKey} onSubmit={event => { event.preventDefault(); const form = event.currentTarget, data = new FormData(form); const parsed = walletSchema.safeParse({ label: data.get('label'), address: data.get('address'), network: data.get('network'), primary: data.has('primary') }); if (!parsed.success) { setWalletValidation(parsed.error.issues[0].message); return } setWalletValidation(''); wallet.mutate(parsed.data) }}><h3>{editing ? 'Editar carteira' : 'Adicionar carteira'}</h3><div className="form-field"><label htmlFor="wallet-label">Nome da carteira</label><input id="wallet-label" name="label" defaultValue={editing?.label} required minLength={2}/></div><div className="form-field"><label htmlFor="wallet-address">Endereço da carteira</label><input id="wallet-address" name="address" defaultValue={editing?.address} required/></div><div className="form-field"><label htmlFor="wallet-network">Rede</label><select id="wallet-network" name="network" defaultValue={editing?.network || 'Ethereum'}><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></div><label><input type="checkbox" name="primary" defaultChecked={editing?.primary} className="wallet-checkbox"/> Carteira principal</label>{walletValidation && <p role="alert" className="field-error">{walletValidation}</p>}<Feedback error={wallet.error} success={wallet.isSuccess}/><div className="mt-4"><Button disabled={wallet.isPending}>Salvar carteira</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setFormKey(value => value + 1) }}>Cancelar edição</Button>}</div></form>}
    </section>}
  </>
}
