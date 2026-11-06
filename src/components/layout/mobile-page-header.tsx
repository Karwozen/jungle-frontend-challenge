import { useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// toHome: telas da conta voltam sempre para a home, e não para a tela anterior
function MobilePageHeader({ title, toHome }: { title: string; toHome?: boolean }) {
  const router = useRouter()
  const navigate = useNavigate()

  return (
    <div className="relative flex items-center justify-center pb-4 md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Voltar"
        className="absolute left-0 rounded-full border-primary/60 bg-transparent text-text-accent"
        onClick={() => (toHome ? navigate({ to: '/' }) : router.history.back())}
      >
        <ChevronLeft />
      </Button>
      <p aria-hidden className="text-base font-bold">
        {title}
      </p>
    </div>
  )
}

export default MobilePageHeader
