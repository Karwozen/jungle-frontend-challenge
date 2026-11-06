import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import PageShell from './page-shell'

function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <PageShell title="Algo deu errado">
      <p role="alert" className="mt-3 text-muted-foreground">
        {(error instanceof Error && error.message) || 'Não foi possível carregar esta página.'}
      </p>
      <Button
        className="mt-6"
        onClick={() => {
          reset()
          router.invalidate()
        }}
      >
        Tentar novamente
      </Button>
    </PageShell>
  )
}

export default RouteError
