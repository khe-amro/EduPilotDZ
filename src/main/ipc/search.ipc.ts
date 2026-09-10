import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import { performGlobalSearch } from '../services/search.service'
import { z } from 'zod'

export function registerSearchHandlers(): void {
  handle(IPC_CHANNELS.SEARCH_GLOBAL, async (payload) => {
    const { query } = z.object({ query: z.string().min(1).max(100) }).parse(payload)
    return performGlobalSearch(query)
  })
}
