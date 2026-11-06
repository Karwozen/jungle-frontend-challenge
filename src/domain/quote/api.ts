import { http } from '@/lib/http'
import { quote, type Quote, type QuoteRequest } from './schema'

export async function getQuote(body: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  const { data } = await http.post('/quote', body, { signal })
  return quote.parse(data)
}
