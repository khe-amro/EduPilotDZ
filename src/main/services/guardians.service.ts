import { getDb, getSqlite, schema } from '../database/connection'
import { eq, desc, like, or, sql, and } from 'drizzle-orm'
import { AppError, ErrorCode } from '../../shared/errors/index'
import type { Guardian, StudentGuardianLink, FamilySummary, Student } from '../../shared/types/index'
import log from 'electron-log'

export interface CreateGuardianInput {
  fullName: string
  phone?: string | null
  whatsappPhone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

export interface UpdateGuardianInput extends Partial<CreateGuardianInput> {}

export async function listGuardians(query: { search?: string; limit?: number; offset?: number } = {}): Promise<{ items: Guardian[]; total: number }> {
  const db = getDb()
  const limit = Math.min(query.limit ?? 50, 200)
  const offset = query.offset ?? 0

  let conditions: any[] = []
  if (query.search?.trim()) {
    const s = `%${query.search.trim()}%`
    conditions.push(or(like(schema.guardians.fullName, s), like(schema.guardians.phone, s), like(schema.guardians.whatsappPhone, s)))
  }

  const whereClause = conditions.length > 0 ? or(...conditions) : undefined

  const items = await db
    .select()
    .from(schema.guardians)
    .where(whereClause)
    .orderBy(desc(schema.guardians.createdAt))
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.guardians)
    .where(whereClause)

  return {
    items: items as Guardian[],
    total: countResult[0]?.count ?? items.length,
  }
}

export async function getGuardianById(id: number): Promise<Guardian | null> {
  const db = getDb()
  const rows = await db.select().from(schema.guardians).where(eq(schema.guardians.id, id)).limit(1)
  return (rows[0] as Guardian) || null
}

export async function createGuardian(data: CreateGuardianInput): Promise<Guardian> {
  if (!data.fullName?.trim()) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Guardian full name is required')
  }
  const db = getDb()
  const result = await db.insert(schema.guardians).values({
    fullName: data.fullName.trim(),
    phone: data.phone?.trim() || null,
    whatsappPhone: data.whatsappPhone?.trim() || null,
    email: data.email?.trim() || null,
    address: data.address?.trim() || null,
    notes: data.notes?.trim() || null,
  }).returning()

  return result[0] as Guardian
}

export async function updateGuardian(id: number, data: UpdateGuardianInput): Promise<Guardian> {
  const db = getDb()
  const existing = await getGuardianById(id)
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, 'Guardian not found')

  const updateValues: Record<string, any> = { updatedAt: sql`datetime('now')` }
  if (data.fullName !== undefined) updateValues.fullName = data.fullName.trim()
  if (data.phone !== undefined) updateValues.phone = data.phone?.trim() || null
  if (data.whatsappPhone !== undefined) updateValues.whatsappPhone = data.whatsappPhone?.trim() || null
  if (data.email !== undefined) updateValues.email = data.email?.trim() || null
  if (data.address !== undefined) updateValues.address = data.address?.trim() || null
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null

  const result = await db.update(schema.guardians).set(updateValues).where(eq(schema.guardians.id, id)).returning()
  return result[0] as Guardian
}

export async function deleteGuardian(id: number): Promise<void> {
  const db = getDb()
  await db.delete(schema.guardians).where(eq(schema.guardians.id, id))
}

export async function linkStudentGuardian(
  studentIdOrInput: number | { studentId: number; guardianId: number; relationship?: string; isPrimaryContact?: boolean; isEmergencyContact?: boolean },
  maybeGuardianId?: number,
  relationship: string = 'parent',
  isPrimary: boolean = true
): Promise<void> {
  const db = getDb()

  let studentId: number
  let guardianId: number
  let rel = relationship
  let primary = isPrimary

  if (typeof studentIdOrInput === 'object') {
    studentId = studentIdOrInput.studentId
    guardianId = studentIdOrInput.guardianId
    rel = studentIdOrInput.relationship || 'parent'
    primary = studentIdOrInput.isPrimaryContact ?? true
  } else {
    studentId = studentIdOrInput
    guardianId = maybeGuardianId!
  }

  if (primary) {
    // Unset primary on other guardians for this student
    await db.update(schema.studentGuardians)
      .set({ isPrimary: false })
      .where(eq(schema.studentGuardians.studentId, studentId))
  }

  await db.insert(schema.studentGuardians)
    .values({
      studentId,
      guardianId,
      relationship: rel,
      isPrimary: primary,
    })
    .onConflictDoUpdate({
      target: [schema.studentGuardians.studentId, schema.studentGuardians.guardianId],
      set: { relationship: rel, isPrimary: primary },
    })
}

export async function unlinkStudentGuardian(studentId: number, guardianId: number): Promise<boolean> {
  const db = getDb()
  await db.delete(schema.studentGuardians).where(
    and(
      eq(schema.studentGuardians.studentId, studentId),
      eq(schema.studentGuardians.guardianId, guardianId)
    )
  )
  return true
}

export async function getStudentGuardians(studentId: number): Promise<StudentGuardianLink[]> {
  const sqlite = getSqlite()
  const rows = sqlite.prepare(`
    SELECT sg.id, sg.student_id as studentId, sg.guardian_id as guardianId,
           sg.relationship, sg.is_primary as isPrimary,
           g.id as g_id, g.full_name as g_fullName, g.phone as g_phone,
           g.whatsapp_phone as g_whatsappPhone, g.email as g_email,
           g.address as g_address, g.notes as g_notes,
           g.created_at as g_createdAt, g.updated_at as g_updatedAt
    FROM student_guardians sg
    JOIN guardians g ON g.id = sg.guardian_id
    WHERE sg.student_id = ?
    ORDER BY sg.is_primary DESC, sg.created_at ASC
  `).all(studentId) as any[]

  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    guardianId: r.guardianId,
    relationship: r.relationship,
    isPrimary: Boolean(r.isPrimary),
    guardian: {
      id: r.g_id,
      fullName: r.g_fullName,
      phone: r.g_phone,
      whatsappPhone: r.g_whatsappPhone,
      email: r.g_email,
      address: r.g_address,
      notes: r.g_notes,
      createdAt: r.g_createdAt,
      updatedAt: r.g_updatedAt,
    },
  }))
}

export const getGuardiansForStudent = getStudentGuardians

export async function getFamilySummary(guardianId: number): Promise<FamilySummary> {
  const guardian = await getGuardianById(guardianId)
  if (!guardian) throw new AppError(ErrorCode.NOT_FOUND, 'Guardian not found')

  const sqlite = getSqlite()
  // Fetch all students linked to this guardian
  const students = sqlite.prepare(`
    SELECT s.*,
           (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active') as activeEnrollmentsCount,
           COALESCE((
             SELECT SUM(
               CASE 
                 WHEN p.status = 'cancelled' THEN 0
                 WHEN p.payment_type IN ('credit', 'payment', 'transfer_in') THEN p.amount
                 WHEN p.payment_type IN ('deduction', 'session_charge', 'transfer_out', 'refund', 'enrollment_refund') THEN -p.amount
                 ELSE p.amount
               END
             ) FROM payments p WHERE p.student_id = s.id
           ), 0) as totalBalance
    FROM students s
    JOIN student_guardians sg ON sg.student_id = s.id
    WHERE sg.guardian_id = ?
    ORDER BY s.last_name_fr ASC
  `).all(guardianId) as any[]

  let totalFamilyBalance = 0
  const studentList = students.map((s) => {
    const bal = Number(s.totalBalance || 0)
    totalFamilyBalance += bal
    return {
      ...s,
      qrTokenActive: Boolean(s.qr_token_active),
      activeEnrollmentsCount: Number(s.activeEnrollmentsCount || 0),
      totalBalance: bal,
    } as Student & { activeEnrollmentsCount: number; totalBalance: number }
  })

  return {
    guardian,
    students: studentList,
    totalFamilyBalance,
  }
}
