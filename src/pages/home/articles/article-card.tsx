import { ArrowRight } from 'lucide-react'
import type { ArticleSummary } from '@/domain/articles/schema'
import { formatDay } from '@/lib/date'
import { imageSrcSet } from '@/lib/images'
import { outOfScope } from '@/lib/out-of-scope'

function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card">
      <div className="group overflow-hidden">
        <img
          src={article.image.url}
          srcSet={imageSrcSet(article.image)}
          sizes="(min-width: 1024px) 280px, (min-width: 768px) 45vw, 90vw"
          width={article.image.width}
          height={article.image.height}
          alt=""
          loading="lazy"
          className="aspect-4/3 w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-tiny text-muted-foreground">
          {formatDay(article.publishedAt)} | Leitura de {article.readingMinutes} min
        </p>
        <h3 className="mt-2 text-sm font-bold">{article.title}</h3>
        <p className="mt-2 text-xs text-text-secondary">{article.excerpt}</p>
        <button
          type="button"
          onClick={outOfScope}
          className="mt-auto flex items-center gap-1 self-start rounded-sm pt-3 text-tiny font-bold text-text-accent outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Ler mais <ArrowRight className="size-3" />
        </button>
      </div>
    </article>
  )
}

export default ArticleCard
