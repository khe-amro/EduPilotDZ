import { getDb, getSqlite, schema } from '../database/connection'
import { eq, desc } from 'drizzle-orm'
import { AppError, ErrorCode } from '../../shared/errors/index'
import type { StudentCardInfo, CardStatus } from '../../shared/types/index'
import crypto from 'node:crypto'
import log from 'electron-log'

export function generateSecureCardToken(): string {
  return `EDP2:${crypto.randomUUID()}`
}

export async function getCardsByStudent(studentId: number): Promise<StudentCardInfo[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(schema.studentCards)
    .where(eq(schema.studentCards.studentId, studentId))
    .orderBy(desc(schema.studentCards.createdAt))

  return rows as StudentCardInfo[]
}

export async function getActiveCardByStudent(studentId: number): Promise<StudentCardInfo | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(schema.studentCards)
    .where(eq(schema.studentCards.studentId, studentId))
    .orderBy(desc(schema.studentCards.createdAt))

  const active = rows.find((c) => c.status === 'ACTIVE')
  return (active as StudentCardInfo) || null
}

export async function issueCard(studentId: number, options: { expiresAt?: string; notes?: string } = {}): Promise<StudentCardInfo> {
  const sqlite = getSqlite()

  return sqlite.transaction(() => {
    // Check student exists
    const student = sqlite.prepare(`SELECT id, student_number FROM students WHERE id = ?`).get(studentId) as any
    if (!student) throw new AppError(ErrorCode.STUDENT_NOT_FOUND, 'Student not found')

    // Disable any currently active cards
    sqlite.prepare(`
      UPDATE student_cards
      SET status = 'DISABLED', notes = COALESCE(notes || ' | ', '') || 'Superseded by new card issue'
      WHERE student_id = ? AND status = 'ACTIVE'
    `).run(studentId)

    const token = generateSecureCardToken()

    // Insert new card record
    const insertCard = sqlite.prepare(`
      INSERT INTO student_cards (student_id, card_token, status, issued_at, expires_at, notes, created_at)
      VALUES (?, ?, 'ACTIVE', datetime('now'), ?, ?, datetime('now'))
    `).run(studentId, token, options.expiresAt || null, options.notes || null)

    // Sync student active qr_token
    sqlite.prepare(`
      UPDATE students
      SET qr_token = ?, qr_token_active = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(token, studentId)

    const newCard = sqlite.prepare(`SELECT * FROM student_cards WHERE id = ?`).get(insertCard.lastInsertRowid) as any
    return {
      id: newCard.id,
      studentId: newCard.student_id,
      cardToken: newCard.card_token,
      status: newCard.status as CardStatus,
      issuedAt: newCard.issued_at,
      expiresAt: newCard.expires_at,
      replacedByCardId: newCard.replaced_by_card_id,
      notes: newCard.notes,
    }
  })()
}

export async function markCardLost(cardId: number, notes?: string): Promise<StudentCardInfo> {
  const sqlite = getSqlite()

  return sqlite.transaction(() => {
    const card = sqlite.prepare(`SELECT * FROM student_cards WHERE id = ?`).get(cardId) as any
    if (!card) throw new AppError(ErrorCode.NOT_FOUND, 'Card not found')

    sqlite.prepare(`
      UPDATE student_cards
      SET status = 'LOST', notes = COALESCE(notes || ' | ', '') || ?, created_at = created_at
      WHERE id = ?
    `).run(notes ? `Reported lost: ${notes}` : 'Reported lost', cardId)

    // If this was the active card, disable student's token
    sqlite.prepare(`
      UPDATE students
      SET qr_token_active = 0, updated_at = datetime('now')
      WHERE id = ? AND qr_token = ?
    `).run(card.student_id, card.card_token)

    const updated = sqlite.prepare(`SELECT * FROM student_cards WHERE id = ?`).get(cardId) as any
    return {
      id: updated.id,
      studentId: updated.student_id,
      cardToken: updated.card_token,
      status: updated.status as CardStatus,
      issuedAt: updated.issued_at,
      expiresAt: updated.expires_at,
      replacedByCardId: updated.replaced_by_card_id,
      notes: updated.notes,
    }
  })()
}

export async function replaceCard(
  oldCardId: number,
  options: { reason?: string; expiresAt?: string } = {}
): Promise<StudentCardInfo> {
  const sqlite = getSqlite()

  return sqlite.transaction(() => {
    const oldCard = sqlite.prepare(`SELECT * FROM student_cards WHERE id = ?`).get(oldCardId) as any
    if (!oldCard) throw new AppError(ErrorCode.NOT_FOUND, 'Old card not found')

    const newToken = generateSecureCardToken()

    // Create replacement card
    const insertNew = sqlite.prepare(`
      INSERT INTO student_cards (student_id, card_token, status, issued_at, expires_at, notes, created_at)
      VALUES (?, ?, 'ACTIVE', datetime('now'), ?, ?, datetime('now'))
    `).run(
      oldCard.student_id,
      newToken,
      options.expiresAt || null,
      options.reason ? `Replaced card #${oldCardId}: ${options.reason}` : `Replaced card #${oldCardId}`
    )
    const newCardId = insertNew.lastInsertRowid

    // Mark old card as REPLACED
    sqlite.prepare(`
      UPDATE student_cards
      SET status = 'REPLACED', replaced_by_card_id = ?, notes = COALESCE(notes || ' | ', '') || ?
      WHERE id = ?
    `).run(newCardId, `Superseded by card #${newCardId}`, oldCardId)

    // Update student's active QR token
    sqlite.prepare(`
      UPDATE students
      SET qr_token = ?, qr_token_active = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(newToken, oldCard.student_id)

    const newCard = sqlite.prepare(`SELECT * FROM student_cards WHERE id = ?`).get(newCardId) as any
    return {
      id: newCard.id,
      studentId: newCard.student_id,
      cardToken: newCard.card_token,
      status: newCard.status as CardStatus,
      issuedAt: newCard.issued_at,
      expiresAt: newCard.expires_at,
      replacedByCardId: newCard.replaced_by_card_id,
      notes: newCard.notes,
    }
  })()
}

export async function disableCard(cardId: number, notes?: string): Promise<void> {
  const sqlite = getSqlite()
  const card = sqlite.prepare(`SELECT * FROM student_cards WHERE id = ?`).get(cardId) as any
  if (!card) throw new AppError(ErrorCode.NOT_FOUND, 'Card not found')

  sqlite.prepare(`
    UPDATE student_cards
    SET status = 'DISABLED', notes = COALESCE(notes || ' | ', '') || ?
    WHERE id = ?
  `).run(notes ? `Disabled: ${notes}` : 'Disabled', cardId)

  sqlite.prepare(`
    UPDATE students
    SET qr_token_active = 0, updated_at = datetime('now')
    WHERE id = ? AND qr_token = ?
  `).run(card.student_id, card.card_token)
}

export async function resolveCardToken(token: string): Promise<{ studentId: number; studentNumber: string; isValid: boolean; status: CardStatus }> {
  const sqlite = getSqlite()

  // First check student_cards
  const card = sqlite.prepare(`
    SELECT sc.*, s.student_number
    FROM student_cards sc
    JOIN students s ON s.id = sc.student_id
    WHERE sc.card_token = ?
    LIMIT 1
  `).get(token) as any

  if (card) {
    return {
      studentId: card.student_id,
      studentNumber: card.student_number,
      isValid: card.status === 'ACTIVE',
      status: card.status as CardStatus,
    }
  }

  // Fallback: check students table direct qr_token (for initial records)
  const student = sqlite.prepare(`
    SELECT id, student_number, qr_token_active
    FROM students
    WHERE qr_token = ?
    LIMIT 1
  `).get(token) as any

  if (student) {
    return {
      studentId: student.id,
      studentNumber: student.student_number,
      isValid: Boolean(student.qr_token_active),
      status: student.qr_token_active ? 'ACTIVE' : 'DISABLED',
    }
  }

  throw new AppError(ErrorCode.UNKNOWN_CARD, 'Card token not recognized')
}
