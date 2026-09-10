import { getDb, schema } from '../database/connection'
import { eq, ne, and, sql } from 'drizzle-orm'
import { hashPassword, requireSession } from './auth.service'
import { AppError, ErrorCode } from '../../shared/errors/index'
import type { AdminRole, Language } from '../../shared/types/index'
import log from 'electron-log'

export interface AdminUserSummary {
  id: number
  username: string
  fullName: string
  role: AdminRole
  preferredLanguage: Language
  isActive: boolean
  lastLoginAt: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const db = getDb()
  const rows = await db.select({
    id: schema.administrators.id,
    username: schema.administrators.username,
    fullName: schema.administrators.fullName,
    role: schema.administrators.role,
    preferredLanguage: schema.administrators.preferredLanguage,
    isActive: schema.administrators.isActive,
    lastLoginAt: schema.administrators.lastLoginAt,
    failedLoginAttempts: schema.administrators.failedLoginAttempts,
    lockedUntil: schema.administrators.lockedUntil,
    createdAt: schema.administrators.createdAt,
    updatedAt: schema.administrators.updatedAt,
  }).from(schema.administrators)

  return rows as AdminUserSummary[]
}

export async function createAdminUser(data: {
  username: string
  fullName: string
  role: AdminRole
  password: string
  preferredLanguage?: Language
}): Promise<AdminUserSummary> {
  const session = requireSession()
  if (session.role !== 'superadmin' && session.role !== 'admin') {
    throw new AppError(ErrorCode.PERMISSION_DENIED, 'Only administrators can create users')
  }

  const db = getDb()
  const existing = await db.query.administrators.findFirst({
    where: eq(schema.administrators.username, data.username.trim()),
  })

  if (existing) {
    throw new AppError(ErrorCode.USERNAME_TAKEN, `Username "${data.username}" is already in use`)
  }

  const passwordHash = await hashPassword(data.password)
  const now = new Date().toISOString()

  const inserted = await db.insert(schema.administrators).values({
    username: data.username.trim(),
    fullName: data.fullName.trim(),
    role: data.role,
    passwordHash,
    preferredLanguage: data.preferredLanguage || 'ar',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).returning()

  const user = inserted[0]
  log.info(`Admin user created: ${user.username} with role ${user.role}`)

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as AdminRole,
    preferredLanguage: user.preferredLanguage as Language,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    failedLoginAttempts: user.failedLoginAttempts,
    lockedUntil: user.lockedUntil,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function updateAdminUser(
  id: number,
  data: Partial<{
    fullName: string
    role: AdminRole
    preferredLanguage: Language
    isActive: boolean
    password?: string
  }>
): Promise<AdminUserSummary> {
  const session = requireSession()
  if (session.role !== 'superadmin' && session.role !== 'admin') {
    throw new AppError(ErrorCode.PERMISSION_DENIED, 'Only administrators can update users')
  }

  const db = getDb()
  const user = await db.query.administrators.findFirst({
    where: eq(schema.administrators.id, id),
  })

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found')
  }

  // Prevent non-superadmin from elevating to superadmin or modifying superadmin
  if (user.role === 'superadmin' && session.role !== 'superadmin') {
    throw new AppError(ErrorCode.PERMISSION_DENIED, 'Only superadmins can modify superadmin accounts')
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  }

  if (data.fullName !== undefined) updateData.fullName = data.fullName.trim()
  if (data.role !== undefined) updateData.role = data.role
  if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.password && data.password.trim().length >= 6) {
    updateData.passwordHash = await hashPassword(data.password.trim())
    updateData.failedLoginAttempts = 0
    updateData.lockedUntil = null
  }

  const updated = await db
    .update(schema.administrators)
    .set(updateData)
    .where(eq(schema.administrators.id, id))
    .returning()

  const u = updated[0]
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role as AdminRole,
    preferredLanguage: u.preferredLanguage as Language,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    failedLoginAttempts: u.failedLoginAttempts,
    lockedUntil: u.lockedUntil,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

export async function deleteAdminUser(id: number): Promise<boolean> {
  const session = requireSession()
  if (session.role !== 'superadmin') {
    throw new AppError(ErrorCode.PERMISSION_DENIED, 'Only superadmins can delete users')
  }

  if (session.adminId === id) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot delete your own active account')
  }

  const db = getDb()
  await db.delete(schema.administrators).where(eq(schema.administrators.id, id))
  log.info(`Admin user ${id} deleted by ${session.username}`)
  return true
}
