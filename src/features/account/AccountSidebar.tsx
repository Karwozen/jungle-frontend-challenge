import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { UserRound, MapPin, ShoppingCart, Heart, ChartNoAxesCombined, Download, TriangleAlert, LogOut } from 'lucide-react'
import { AuxiliaryAction } from '../../components/AuxiliaryAction'
import { api, SESSION_TOKEN_KEY } from '../../shared/api'
import { clearPrivateData } from './session'
export function AccountSidebar() {
  const navigate = useNavigate()
  const logout = useMutation({ mutationFn: () => api.post('/logout'), onSuccess: async () => { localStorage.removeItem(SESSION_TOKEN_KEY); await clearPrivateData(); await navigate({ to: '/', search: { q: '', collection: '', page: 1, sort: 'recent' } }) } })
  return <aside className="account-sidebar"><h2>Meu perfil</h2><nav aria-label="Conta do colecionador">
    <Link to="/account/profile" activeProps={{ 'aria-current': 'page' }}><UserRound/>Dados do perfil</Link>
    <Link to="/account/wallets" activeProps={{ 'aria-current': 'page' }}><MapPin/>Carteiras</Link>
    <AuxiliaryAction title="Atividade"><ShoppingCart/>Atividade</AuxiliaryAction>
    <Link to="/account/favorites" activeProps={{ 'aria-current': 'page' }}><Heart/>Lista de interesse</Link>
    <AuxiliaryAction title="Ofertas"><ChartNoAxesCombined/>Ofertas</AuxiliaryAction>
    <AuxiliaryAction title="Arquivos baixados"><Download/>Arquivos baixados</AuxiliaryAction>
    <AuxiliaryAction title="Suporte"><TriangleAlert/>Suporte</AuxiliaryAction>
    <button type="button" className="sidebar-logout" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut/>Sair</button>
  </nav>{logout.isError && <p role="alert" className="field-error">Não foi possível sair. Tente novamente.</p>}</aside>
}
