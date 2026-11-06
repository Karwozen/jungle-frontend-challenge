import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import PageShell from './page-shell'

function NotFound() {
  return (
    <PageShell title="Página não encontrada">
      <p className="mt-3 text-muted-foreground">O endereço não existe ou foi removido.</p>
      <Button asChild className="mt-6">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </PageShell>
  )
}

export default NotFound
