import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import {
  getCardsByStudent,
  getActiveCardByStudent,
  issueCard,
  markCardLost,
  replaceCard,
  disableCard,
  resolveCardToken,
} from '../services/cards.service'
import { z } from 'zod'

export function registerCardHandlers(): void {
  handle(IPC_CHANNELS.CARDS_GET_BY_STUDENT, async (payload) => {
    const { studentId } = z.object({ studentId: z.number().int().positive() }).parse(payload)
    const cards = await getCardsByStudent(studentId)
    const active = await getActiveCardByStudent(studentId)
    return { cards, activeCard: active }
  })

  handle(IPC_CHANNELS.CARDS_ISSUE, async (payload) => {
    const schema = z.object({
      studentId: z.number().int().positive(),
      expiresAt: z.string().optional(),
      notes: z.string().max(300).optional(),
    })
    const { studentId, ...opts } = schema.parse(payload)
    return issueCard(studentId, opts)
  })

  handle(IPC_CHANNELS.CARDS_MARK_LOST, async (payload) => {
    const schema = z.object({
      cardId: z.number().int().positive(),
      notes: z.string().max(300).optional(),
    })
    const { cardId, notes } = schema.parse(payload)
    return markCardLost(cardId, notes)
  })

  handle(IPC_CHANNELS.CARDS_REPLACE, async (payload) => {
    const schema = z.object({
      oldCardId: z.number().int().positive(),
      reason: z.string().max(200).optional(),
      expiresAt: z.string().optional(),
    })
    const { oldCardId, ...opts } = schema.parse(payload)
    return replaceCard(oldCardId, opts)
  })

  handle(IPC_CHANNELS.CARDS_DISABLE, async (payload) => {
    const schema = z.object({
      cardId: z.number().int().positive(),
      notes: z.string().max(300).optional(),
    })
    const { cardId, notes } = schema.parse(payload)
    return disableCard(cardId, notes)
  })

  handle(IPC_CHANNELS.CARDS_RESOLVE_TOKEN, async (payload) => {
    const { token } = z.object({ token: z.string().min(1) }).parse(payload)
    return resolveCardToken(token)
  })
}
