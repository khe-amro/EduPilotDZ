import { getDb, schema } from '../database/connection'
import { eq } from 'drizzle-orm'
import { shell } from 'electron'
import { AppError, ErrorCode } from '../../shared/errors/index'
import type { WhatsAppTemplate } from '../../shared/types/index'
import log from 'electron-log'

/**
 * Normalize phone number to E.164 format.
 * Supports Algerian local format (05xx, 06xx, 07xx -> +2135xx, etc.)
 * as well as general international formats.
 */
export function normalizePhoneNumber(rawPhone: string, defaultCountryCode = '+213'): string {
  if (!rawPhone) return ''
  // Strip spaces, dashes, dots, parentheses
  let cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '')

  // If already starts with +, keep it
  if (cleaned.startsWith('+')) {
    return cleaned
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2)
  }

  // Algerian local mobile format: starts with 05, 06, 07, or 09
  if (/^0[5679]\d{8}$/.test(cleaned)) {
    return '+213' + cleaned.slice(1)
  }

  // Algerian local landline: starts with 02, 03, 04
  if (/^0[234]\d{7,8}$/.test(cleaned)) {
    return '+213' + cleaned.slice(1)
  }

  // If starts with country code without plus (e.g. 21355...)
  const ccDigits = defaultCountryCode.replace('+', '')
  if (cleaned.startsWith(ccDigits)) {
    return '+' + cleaned
  }

  // If starts with single 0, strip and prepend country code
  if (cleaned.startsWith('0')) {
    return defaultCountryCode + cleaned.slice(1)
  }

  return defaultCountryCode + cleaned
}

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const db = getDb()
  const rows = await db.select().from(schema.whatsappTemplates).where(eq(schema.whatsappTemplates.isActive, true))
  return rows as WhatsAppTemplate[]
}

export async function updateWhatsAppTemplate(
  id: number,
  data: Partial<Pick<WhatsAppTemplate, 'bodyAr' | 'bodyFr' | 'bodyEn' | 'nameAr' | 'nameFr' | 'nameEn' | 'isActive'>>
): Promise<WhatsAppTemplate> {
  const db = getDb()
  const res = await db.update(schema.whatsappTemplates).set(data).where(eq(schema.whatsappTemplates.id, id)).returning()
  if (res.length === 0) throw new AppError(ErrorCode.NOT_FOUND, 'Template not found')
  return res[0] as WhatsAppTemplate
}

export function interpolateTemplateVariables(
  templateBody: string,
  variables: Record<string, string | number | undefined | null>
): string {
  if (!templateBody) return ''

  // Build a normalized variable map supporting both camelCase, snake_case, and common aliases
  const map: Record<string, string> = {}

  for (const [rawKey, rawVal] of Object.entries(variables || {})) {
    const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : ''
    const cleanKey = rawKey.toLowerCase().replace(/[\s_\-]/g, '')

    map[rawKey] = strVal
    map[cleanKey] = strVal

    // Camel to snake
    const snakeKey = rawKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
    map[snakeKey] = strVal

    // Snake to camel
    const camelKey = rawKey.replace(/_([a-z])/g, (_, g) => g.toUpperCase())
    map[camelKey] = strVal
  }

  // Cross-variable aliases
  if (map['studentName'] || map['student_name']) {
    const sName = map['studentName'] || map['student_name']
    map['student'] = sName
    map['student_name'] = sName
    map['studentName'] = sName
    map['eleve'] = sName
  }
  if (map['guardianName'] || map['guardian_name']) {
    const gName = map['guardianName'] || map['guardian_name']
    map['guardian'] = gName
    map['guardian_name'] = gName
    map['guardianName'] = gName
    map['parent'] = gName
    map['tuteur'] = gName
  }
  if (map['schoolName'] || map['school_name']) {
    const sch = map['schoolName'] || map['school_name']
    map['school'] = sch
    map['school_name'] = sch
    map['schoolName'] = sch
    map['ecole'] = sch
  }
  if (map['courseName'] || map['course_name'] || map['course']) {
    const cName = map['courseName'] || map['course_name'] || map['course']
    map['course'] = cName
    map['course_name'] = cName
    map['courseName'] = cName
  }
  if (map['groupName'] || map['group_name'] || map['group']) {
    const grp = map['groupName'] || map['group_name'] || map['group']
    map['group'] = grp
    map['group_name'] = grp
    map['groupName'] = grp
  }
  if (map['balance'] || map['amount'] || map['debt']) {
    const b = map['balance'] || map['amount'] || map['debt']
    map['balance'] = b
    map['amount'] = map['amount'] || b
    map['debt'] = map['debt'] || b
    map['solde'] = b
    map['montant'] = b
  }

  let result = templateBody

  // Replace any {{ placeholder }}
  result = result.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, (_match, p1) => {
    const norm = p1.toLowerCase().replace(/[\s_\-]/g, '')
    if (map[p1] !== undefined && map[p1] !== '') return map[p1]
    if (map[norm] !== undefined && map[norm] !== '') return map[norm]

    // Case-insensitive lookup
    for (const [k, v] of Object.entries(map)) {
      if (k.toLowerCase() === p1.toLowerCase() && v !== '') return v
    }

    // Strip unfulfilled placeholders so raw {{variable}} is never sent to parents
    return ''
  })

  // Clean empty parentheses or redundant whitespace left by stripped optional tokens
  result = result.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim()

  return result
}

export async function openWhatsAppMessage(phone: string, text: string, defaultCountryCode = '+213'): Promise<void> {
  const normalized = normalizePhoneNumber(phone, defaultCountryCode)
  if (!normalized) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phone number for WhatsApp message')
  }

  // Strip '+' for wa.me URL
  const waNumber = normalized.replace('+', '')
  const encodedText = encodeURIComponent(text)
  const url = `https://wa.me/${waNumber}?text=${encodedText}`

  log.info('Opening WhatsApp deep-link:', `https://wa.me/${waNumber}?text=...`)
  await shell.openExternal(url)
}

export async function openWhatsAppChat(
  phone: string,
  templateKey: string,
  params: Record<string, string> = {},
  lang: 'ar' | 'fr' | 'en' = 'ar'
): Promise<string> {
  const db = getDb()

  // Auto-enrich school name from settings if missing or generic
  if (!params.schoolName && !params.school_name) {
    try {
      const settingsRow = await db.query.schoolSettings.findFirst()
      if (settingsRow) {
        const sch = (lang === 'fr' ? settingsRow.schoolNameFr : lang === 'en' ? settingsRow.schoolNameEn : settingsRow.schoolNameAr) || settingsRow.schoolNameAr || 'المؤسسة'
        params.schoolName = sch
        params.school_name = sch
      }
    } catch { /* ignore */ }
  }

  const template = await db.query.whatsappTemplates.findFirst({
    where: eq(schema.whatsappTemplates.templateKey, templateKey),
  })

  let rawBody = ''
  if (template) {
    if (lang === 'fr' && template.bodyFr) rawBody = template.bodyFr
    else if (lang === 'en' && template.bodyEn) rawBody = template.bodyEn
    else rawBody = template.bodyAr
  } else {
    // Default fallback text
    rawBody = params.message || 'مرحباً بكم من إدارة المؤسسة'
  }

  const interpolated = interpolateTemplateVariables(rawBody, params)
  await openWhatsAppMessage(phone, interpolated)
  return interpolated
}
