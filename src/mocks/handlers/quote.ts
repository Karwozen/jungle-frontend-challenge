import { http, HttpResponse } from 'msw'
import { quote, quoteRequest } from '@/domain/quote/schema'
import { buildQuote, createQuote } from '@/mocks/quote'
import { validationError } from '@/mocks/responses'
import { simulate } from '@/mocks/scenarios'

export const quoteHandlers = [
  // público: o visitante também cota o carrinho que ainda está só no navegador
  http.post('/api/quote', async ({ request }) => {
    const failure = await simulate('quote')
    if (failure) return failure

    const parsed = quoteRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const draft = buildQuote(parsed.data.items, parsed.data.coupon)
    return draft instanceof Response ? draft : HttpResponse.json(quote.parse(createQuote(draft)))
  }),
]
