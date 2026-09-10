import { getDb, getSqlite, schema } from '../database/connection'
import { eq, desc } from 'drizzle-orm'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { AppError, ErrorCode } from '../../shared/errors/index'
import type { StudentDocument, DocumentType } from '../../shared/types/index'
import log from 'electron-log'

function getDocumentsVaultDir(): string {
  const dir = path.join(app.getPath('userData'), 'media', 'documents')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export async function listStudentDocuments(studentId: number): Promise<StudentDocument[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(schema.studentDocuments)
    .where(eq(schema.studentDocuments.studentId, studentId))
    .orderBy(desc(schema.studentDocuments.createdAt))

  return rows as StudentDocument[]
}

export async function uploadStudentDocument(
  studentId: number,
  documentType: DocumentType,
  sourceFilePath: string,
  customName?: string
): Promise<StudentDocument> {
  if (!fs.existsSync(sourceFilePath)) {
    throw new AppError(ErrorCode.FILE_NOT_FOUND, 'Source file does not exist')
  }

  const stat = fs.statSync(sourceFilePath)
  if (stat.size > 25 * 1024 * 1024) { // 25MB max
    throw new AppError(ErrorCode.FILE_TOO_LARGE, 'Document exceeds maximum size limit of 25MB')
  }

  const vaultDir = getDocumentsVaultDir()
  const ext = path.extname(sourceFilePath).toLowerCase()
  const baseName = customName || path.basename(sourceFilePath, ext)
  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_')
  const timestamp = Date.now()
  const targetFileName = `doc_${studentId}_${timestamp}_${cleanBaseName}${ext}`
  const targetPath = path.join(vaultDir, targetFileName)

  fs.copyFileSync(sourceFilePath, targetPath)

  // Insert DB record
  const db = getDb()
  const res = await db.insert(schema.studentDocuments).values({
    studentId,
    documentType,
    filePath: targetFileName, // relative to documents vault
    fileName: `${baseName}${ext}`,
    fileSize: stat.size,
    mimeType: getMimeType(ext),
  }).returning()

  return res[0] as StudentDocument
}

export async function deleteStudentDocument(documentId: number): Promise<boolean> {
  const db = getDb()
  const rows = await db.select().from(schema.studentDocuments).where(eq(schema.studentDocuments.id, documentId)).limit(1)
  if (rows.length === 0) return false

  const doc = rows[0]
  const vaultDir = getDocumentsVaultDir()
  const fullPath = path.join(vaultDir, doc.filePath)
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath)
    } catch (e) {
      log.warn('Could not delete physical file for doc:', doc.filePath, e)
    }
  }

  await db.delete(schema.studentDocuments).where(eq(schema.studentDocuments.id, documentId))
  return true
}

export async function getDocumentFilePath(documentId: number): Promise<string> {
  const db = getDb()
  const rows = await db.select().from(schema.studentDocuments).where(eq(schema.studentDocuments.id, documentId)).limit(1)
  if (rows.length === 0) throw new AppError(ErrorCode.NOT_FOUND, 'Document not found')

  const doc = rows[0]
  const vaultDir = getDocumentsVaultDir()
  const fullPath = path.join(vaultDir, doc.filePath)
  if (!fs.existsSync(fullPath)) throw new AppError(ErrorCode.FILE_NOT_FOUND, 'Document file missing from disk')

  return fullPath
}

export async function getDocumentDataUrl(documentId: number): Promise<string> {
  const fullPath = await getDocumentFilePath(documentId)
  const db = getDb()
  const rows = await db.select().from(schema.studentDocuments).where(eq(schema.studentDocuments.id, documentId)).limit(1)
  const doc = rows[0]

  const buffer = fs.readFileSync(fullPath)
  const mime = doc?.mimeType || 'application/octet-stream'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function getMimeType(ext: string): string {
  switch (ext) {
    case '.pdf': return 'application/pdf'
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.webp': return 'image/webp'
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case '.txt': return 'text/plain'
    default: return 'application/octet-stream'
  }
}
