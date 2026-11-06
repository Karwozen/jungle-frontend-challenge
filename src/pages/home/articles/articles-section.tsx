import { useQuery } from '@tanstack/react-query'
import Reveal from '@/components/motion/reveal'
import { Skeleton } from '@/components/ui/skeleton'
import { articlesQuery } from '@/domain/articles/queries'
import ArticleCard from './article-card'

const COUNT = 4

function ArticlesSection() {
  const { data, isPending, isError } = useQuery(articlesQuery(1, COUNT))

  return (
    <section aria-labelledby="diario" className="mx-auto mt-24 w-full max-w-300 px-6 xl:px-0">
      <Reveal>
        <h2 id="diario" className="text-center text-xl font-bold">
          Diário da Cunhagem
        </h2>
        <p className="mt-3 text-center text-xs text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </Reveal>

      {isError ? (
        <p role="alert" className="mt-10 text-center text-xs text-muted-foreground">
          Não foi possível carregar os artigos agora.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isPending
            ? Array.from({ length: COUNT }, (_, i) => (
                <li key={i}>
                  <Skeleton className="aspect-3/4 w-full" />
                </li>
              ))
            : data.items.map((article, i) => (
                <li key={article.id}>
                  <Reveal delay={i * 110} className="h-full">
                    <ArticleCard article={article} />
                  </Reveal>
                </li>
              ))}
        </ul>
      )}
    </section>
  )
}

export default ArticlesSection
