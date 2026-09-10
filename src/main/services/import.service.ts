import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import extract from 'extract-zip'
import { getSqlite } from '../database/connection'
import { AppError, ErrorCode } from '../../shared/errors/index'
import { generateSecureCardToken } from './cards.service'
import log from 'electron-log'

export interface ColumnMapping {
  firstName?: string
  lastName?: string
  firstNameFr?: string
  lastNameFr?: string
  fullName?: string
  phone?: string
  guardianName?: string
  guardianPhone?: string
  guardianRelationship?: string
  groupName?: string
  gender?: string
  dateOfBirth?: string
  address?: string
}

export interface ImportPreviewResult {
  fileName: string
  headers: string[]
  sampleRows: Record<string, string>[]
  totalRowsEstimate: number
}

export interface ImportExecutionResult {
  importedCount: number
  skippedCount: number
  duplicateCount: number
  errorCount: number
  errors: Array<{ row: number; error: string }>
}

/**
 * Parses CSV text taking into account quoted fields and commas.
 */
function parseCsvContent(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  const lines: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++
      currentRow.push(currentField.trim())
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow)
      }
      currentRow = []
      currentField = ''
    } else {
      currentField += char
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow)
    }
  }

  return lines
}

/**
 * Extracts rows from XLSX by unzipping sheet1.xml and sharedStrings.xml
 */
async function parseXlsxContent(filePath: string): Promise<string[][]> {
  const tmpDir = path.join(os.tmpdir(), `xlsx_parse_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  try {
    await extract(filePath, { dir: tmpDir })

    // Read shared strings if present
    const sharedStringsPath = path.join(tmpDir, 'xl', 'sharedStrings.xml')
    const sharedStrings: string[] = []
    if (fs.existsSync(sharedStringsPath)) {
      const xml = fs.readFileSync(sharedStringsPath, 'utf8')
      const matches = xml.match(/<t[^>]*>(.*?)<\/t>/gs) || []
      for (const m of matches) {
        const text = m.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        sharedStrings.push(text)
      }
    }

    // Read sheet1.xml
    const sheetPath = path.join(tmpDir, 'xl', 'worksheets', 'sheet1.xml')
    if (!fs.existsSync(sheetPath)) {
      throw new Error('Sheet1 not found in XLSX')
    }

    const sheetXml = fs.readFileSync(sheetPath, 'utf8')
    const rowMatches = sheetXml.match(/<row[^>]*>(.*?)<\/row>/gs) || []
    const rows: string[][] = []

    for (const rowXml of rowMatches) {
      const cellMatches = rowXml.match(/<c[^>]*>(.*?)<\/c>/gs) || []
      const rowData: string[] = []

      for (const cXml of cellMatches) {
        const isShared = cXml.includes('t="s"')
        const valMatch = cXml.match(/<v>(.*?)<\/v>/)
        if (valMatch) {
          const val = valMatch[1]
          if (isShared) {
            const idx = parseInt(val, 10)
            rowData.push(sharedStrings[idx] || '')
          } else {
            rowData.push(val)
          }
        } else {
          rowData.push('')
        }
      }

      if (rowData.some((d) => d.length > 0)) {
        rows.push(rowData)
      }
    }

    return rows
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch { /* ignore */ }
  }
}

async function readFileRows(filePath: string): Promise<string[][]> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.xlsx') {
    return parseXlsxContent(filePath)
  }
  // Default to CSV
  const content = fs.readFileSync(filePath, 'utf8')
  return parseCsvContent(content)
}

export async function previewStudentImport(filePath: string): Promise<ImportPreviewResult> {
  if (!fs.existsSync(filePath)) throw new AppError(ErrorCode.FILE_NOT_FOUND, 'Import file not found')

  const rows = await readFileRows(filePath)
  if (rows.length === 0) throw new AppError(ErrorCode.VALIDATION_ERROR, 'File is empty')

  const headers = rows[0]
  const sampleRows: Record<string, string>[] = []

  for (let i = 1; i < Math.min(rows.length, 11); i++) {
    const record: Record<string, string> = {}
    headers.forEach((h, idx) => {
      record[h] = rows[i][idx] || ''
    })
    sampleRows.push(record)
  }

  return {
    fileName: path.basename(filePath),
    headers,
    sampleRows,
    totalRowsEstimate: Math.max(0, rows.length - 1),
  }
}

export async function executeStudentImport(
  filePath: string,
  mapping: ColumnMapping,
  options: {
    skipDuplicates?: boolean
    defaultGroupId?: number
    skipHeader?: boolean
    defaultGender?: 'male' | 'female'
    createCards?: boolean
    autoLinkGroups?: boolean
  } = {}
): Promise<ImportExecutionResult> {
  const rows = await readFileRows(filePath)
  if (rows.length < 2) throw new AppError(ErrorCode.VALIDATION_ERROR, 'No data rows to import')

  const headers = rows[0]
  const headerIndices: Record<string, number> = {}
  headers.forEach((h, i) => {
    headerIndices[h] = i
  })

  const getVal = (row: string[], colName?: string): string => {
    if (!colName || headerIndices[colName] === undefined) return ''
    return (row[headerIndices[colName]] || '').trim()
  }

  const sqlite = getSqlite()

  let importedCount = 0
  let skippedCount = 0
  let duplicateCount = 0
  let errorCount = 0
  const errors: Array<{ row: number; error: string }> = []

  // Run in a single transactional unit (Requirement 29, 70, 80)
  const runTransaction = sqlite.transaction(() => {
    // Get next student sequence
    const countRow = sqlite.prepare(`SELECT COUNT(*) as count FROM students`).get() as any
    let seq = (countRow?.count || 0) + 1

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const rowNumber = r + 1

      let firstName = getVal(row, mapping.firstName)
      let lastName = getVal(row, mapping.lastName)
      let firstNameFr = getVal(row, mapping.firstNameFr) || firstName
      let lastNameFr = getVal(row, mapping.lastNameFr) || lastName

      if (!firstName && !lastName && mapping.fullName) {
        const full = getVal(row, mapping.fullName)
        const parts = full.split(/\s+/)
        lastName = parts[0] || ''
        firstName = parts.slice(1).join(' ') || parts[0] || ''
        if (!firstNameFr) firstNameFr = firstName
        if (!lastNameFr) lastNameFr = lastName
      }

      if (!firstName || !lastName) {
        errors.push({ row: rowNumber, error: 'First name and last name are required' })
        errorCount++
        continue
      }

      const phone = getVal(row, mapping.phone) || null
      const guardianName = getVal(row, mapping.guardianName) || null
      const guardianPhone = getVal(row, mapping.guardianPhone) || null
      const guardianRel = getVal(row, mapping.guardianRelationship) || 'ولي أمر'
      const groupName = getVal(row, mapping.groupName) || null
      const rawGender = getVal(row, mapping.gender) || ''
      const gender = rawGender.toLowerCase().includes('f') || rawGender.includes('أنثى') ? 'female' : 'male'
      const address = getVal(row, mapping.address) || null
      const dob = getVal(row, mapping.dateOfBirth) || null

      // Duplicate detection
      const existingStudent = sqlite.prepare(`
        SELECT id FROM students 
        WHERE (first_name_ar = ? AND last_name_ar = ?)
           OR (first_name_fr = ? AND last_name_fr = ?)
           OR (phone IS NOT NULL AND phone = ?)
        LIMIT 1
      `).get(firstName, lastName, firstNameFr, lastNameFr, phone) as any

      if (existingStudent) {
        duplicateCount++
        if (options.skipDuplicates !== false) {
          skippedCount++
          continue
        }
      }

      const year = new Date().getFullYear()
      const studentNumber = `STD-${year}-${String(seq).padStart(5, '0')}`
      seq++

      const token = generateSecureCardToken()

      // Insert Student
      const insertStudent = sqlite.prepare(`
        INSERT INTO students (
          student_number, first_name_ar, last_name_ar, first_name_fr, last_name_fr,
          date_of_birth, gender, phone, guardian_name, guardian_phone, guardian_relationship, address,
          qr_token, qr_token_active, status, registration_date, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', date('now'), datetime('now'), datetime('now')
        )
      `).run(
        studentNumber,
        firstName,
        lastName,
        firstNameFr,
        lastNameFr,
        dob,
        gender,
        phone,
        guardianName,
        guardianPhone,
        guardianRel,
        address,
        token
      )

      const studentId = Number(insertStudent.lastInsertRowid)

      // Create Active Student Card record
      sqlite.prepare(`
        INSERT INTO student_cards (student_id, card_token, status, issued_at, notes, created_at)
        VALUES (?, ?, 'ACTIVE', datetime('now'), 'Imported card', datetime('now'))
      `).run(studentId, token)

      // Create/Reuse Guardian if guardian details present
      if (guardianName || guardianPhone) {
        let guardianId: number | null = null
        if (guardianPhone) {
          const existingG = sqlite.prepare(`SELECT id FROM guardians WHERE phone = ? LIMIT 1`).get(guardianPhone) as any
          if (existingG) guardianId = existingG.id
        }

        if (!guardianId) {
          const insertG = sqlite.prepare(`
            INSERT INTO guardians (full_name, phone, whatsapp_phone, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
          `).run(guardianName || 'ولي أمر', guardianPhone, guardianPhone, address)
          guardianId = Number(insertG.lastInsertRowid)
        }

        if (guardianId) {
          sqlite.prepare(`
            INSERT OR IGNORE INTO student_guardians (student_id, guardian_id, relationship, is_primary)
            VALUES (?, ?, ?, 1)
          `).run(studentId, guardianId, guardianRel)
        }
      }

      // Group enrollment if group specified
      let targetGroupId = options.defaultGroupId
      if (groupName) {
        const foundGroup = sqlite.prepare(`SELECT id, monthly_price FROM groups WHERE name LIKE ? LIMIT 1`).get(`%${groupName}%`) as any
        if (foundGroup) targetGroupId = foundGroup.id
      }

      if (targetGroupId) {
        const grp = sqlite.prepare(`SELECT id, monthly_price FROM groups WHERE id = ?`).get(targetGroupId) as any
        if (grp) {
          sqlite.prepare(`
            INSERT OR IGNORE INTO enrollments (student_id, group_id, agreed_price, enrollment_date, status, created_at, updated_at)
            VALUES (?, ?, ?, date('now'), 'active', datetime('now'), datetime('now'))
          `).run(studentId, targetGroupId, grp.monthly_price || 0)
        }
      }

      importedCount++
    }
  })

  runTransaction()

  log.info(`Import complete: ${importedCount} imported, ${skippedCount} skipped, ${duplicateCount} duplicates, ${errorCount} errors`)
  return {
    importedCount,
    skippedCount,
    duplicateCount,
    errorCount,
    errors,
  }
}

export const parseFileForPreview = previewStudentImport
export const executeImport = executeStudentImport
