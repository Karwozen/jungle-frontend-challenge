import { http, HttpResponse } from 'msw'
import type { ArticlesPage } from '@/domain/articles/schema'
import { getDb } from '@/mocks/db'
import { getScenario, simulate } from '@/mocks/scenarios'

export const articlesHandlers = [
  http.get('/api/articles', async ({ request }) => {
    const failure = await simulate('articles')
    if (failure) return failure

    const params = new URL(request.url).searchParams
    const page = Math.max(1, Number(params.get('page')) || 1)
    const pageSize = Math.min(24, Math.max(1, Number(params.get('pageSize')) || 6))

    const all = getScenario('articles') === 'empty' ? [] : [...getDb().articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    const start = (page - 1) * pageSize

    const body: ArticlesPage = {
      items: all.slice(start, start + pageSize),
      page,
      pageSize,
      total: all.length,
      totalPages: Math.ceil(all.length / pageSize),
    }
    return HttpResponse.json(body)
  }),
]
