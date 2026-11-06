import { http } from '@/lib/http'
import { articlesPage, type ArticlesPage } from './schema'

interface ListArticlesParams {
  page?: number
  pageSize?: number
}

export async function listArticles(
  { page = 1, pageSize = 6 }: ListArticlesParams = {},
  signal?: AbortSignal,
): Promise<ArticlesPage> {
  const { data } = await http.get('/articles', { params: { page, pageSize }, signal })
  return articlesPage.parse(data)
}
