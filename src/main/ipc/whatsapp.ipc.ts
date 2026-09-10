import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import {
  getWhatsAppTemplates,
  updateWhatsAppTemplate,
  openWhatsAppChat,
  normalizePhoneNumber,
} from '../services/whatsapp.service'
import { z } from 'zod'

export function registerWhatsAppHandlers(): void {
  handle(IPC_CHANNELS.WHATSAPP_GET_TEMPLATES, async () => {
    return getWhatsAppTemplates()
  })

  handle(IPC_CHANNELS.WHATSAPP_UPDATE_TEMPLATE, async (payload) => {
    const schema = z.object({
      id: z.number().int().positive(),
      bodyAr: z.string().optional(),
      bodyFr: z.string().optional(),
      bodyEn: z.string().optional(),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      nameEn: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    const { id, ...data } = schema.parse(payload)
    return updateWhatsAppTemplate(id, data)
  })

  handle(IPC_CHANNELS.WHATSAPP_OPEN, async (payload) => {
    const schema = z.object({
      phone: z.string().min(1),
      templateKey: z.string().min(1),
      params: z.record(z.string(), z.string()).optional(),
      lang: z.enum(['ar', 'fr', 'en']).optional(),
    })
    const data = schema.parse(payload)
    return openWhatsAppChat(data.phone, data.templateKey, data.params || {}, data.lang || 'ar')
  })

  handle('whatsapp:normalizePhone', async (payload) => {
    const { phone } = z.object({ phone: z.string() }).parse(payload)
    return { normalized: normalizePhoneNumber(phone) }
  })
}
