import { Button } from '@/components/ui/button'
import { outOfScope } from '@/lib/out-of-scope'

function FooterHighlights() {
  return (
    <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 bg-card px-12 py-8">
      <div className="grid content-start gap-3 border-r border-primary/60 pr-6">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
        >
          W
        </span>
        <h2 className="text-[17px] font-bold">Segurança da carteira</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Proteja sua carteira e colecione arte digital verificada com confiança.
        </p>
      </div>

      <div className="grid content-start gap-3 border-r border-primary/60 px-6 max-lg:border-r-0">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
        >
          C
        </span>
        <h2 className="text-[17px] font-bold">Criadores em destaque</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
        </p>
      </div>

      <div className="grid content-start gap-3 border-r border-primary/60 px-6">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
        >
          D
        </span>
        <h2 className="text-[17px] font-bold xl:whitespace-nowrap">Alertas de lançamentos</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
        </p>
      </div>

      <form
        className="grid content-start gap-3 pl-6"
        onSubmit={(event) => {
          event.preventDefault()
          outOfScope()
        }}
      >
        <h2 className="text-[17px] font-bold">Antecipe-se ao próximo lançamento</h2>
        <div className="flex overflow-hidden rounded-sm border border-border-soft bg-surface-dark transition-colors hover:border-primary focus-within:border-text-accent focus-within:ring-2 focus-within:ring-ring/40">
          <label htmlFor="newsletter" className="sr-only">
            E-mail
          </label>
          <input
            id="newsletter"
            type="email"
            placeholder="digite seu e-mail..."
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" className="h-10 rounded-l-none rounded-r-sm">
            Enviar
          </Button>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
        </p>
      </form>
    </div>
  )
}

export default FooterHighlights
