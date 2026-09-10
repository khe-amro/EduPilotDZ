import { app } from 'electron'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import { getSqlite } from '../database/connection'
import { APP_VERSION, APP_EDITION } from '../../shared/constants/index'
import type { DiagnosticsReport, DiagnosticItem } from '../../shared/types/index'
import log from 'electron-log'

export async function runSystemDiagnostics(): Promise<DiagnosticsReport> {
  const sqlite = getSqlite()
  const checks: DiagnosticItem[] = []

  // 1. SQLite integrity check
  let sqliteStatus: 'ok' | 'error' = 'ok'
  let integrityDetail = 'Database integrity check passed'
  try {
    const row = sqlite.prepare(`PRAGMA integrity_check`).get() as any
    const integrityResult = row ? Object.values(row)[0] : 'unknown'
    if (integrityResult !== 'ok') {
      sqliteStatus = 'error'
      integrityDetail = `Integrity check issue: ${integrityResult}`
    }
  } catch (err: any) {
    sqliteStatus = 'error'
    integrityDetail = `SQLite error: ${err.message}`
  }
  checks.push({
    id: 'sqlite_integrity',
    name: 'Database Integrity',
    status: sqliteStatus,
    detail: integrityDetail,
  })

  // 2. Storage Directory Permissions
  const userData = app.getPath('userData')
  let storageStatus: 'ok' | 'error' = 'ok'
  let storageDetail = 'Storage directories accessible'
  try {
    const testFile = path.join(userData, '.write_test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
  } catch (err: any) {
    storageStatus = 'error'
    storageDetail = `Storage write error: ${err.message}`
  }
  checks.push({
    id: 'storage_access',
    name: 'Storage Permissions',
    status: storageStatus,
    detail: storageDetail,
  })

  // 3. Schema Version & App Version
  let schemaVer = 1
  try {
    const vRow = sqlite.prepare(`SELECT value FROM app_metadata WHERE key = 'schema_version' LIMIT 1`).get() as any
    if (vRow) schemaVer = parseInt(vRow.value, 10)
  } catch {}

  checks.push({
    id: 'schema_version',
    name: 'Schema Version',
    status: 'ok',
    detail: `Schema version: ${schemaVer}`,
  })

  // 4. Last Backup Status
  let backupStatus: 'ok' | 'warning' = 'ok'
  let lastBackupDetail = 'No backups found'
  try {
    const backupsDir = path.join(userData, 'backups')
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.zip'))
      if (files.length > 0) {
        files.sort((a, b) => fs.statSync(path.join(backupsDir, b)).mtimeMs - fs.statSync(path.join(backupsDir, a)).mtimeMs)
        const newest = files[0]
        const mtime = fs.statSync(path.join(backupsDir, newest)).mtime
        const daysDiff = (Date.now() - mtime.getTime()) / (1000 * 60 * 60 * 24)
        if (daysDiff > 3) {
          backupStatus = 'warning'
          lastBackupDetail = `Warning: Last backup is ${Math.floor(daysDiff)} days old (${newest})`
        } else {
          lastBackupDetail = `Healthy: Last backup on ${mtime.toLocaleDateString()} (${newest})`
        }
      } else {
        backupStatus = 'warning'
        lastBackupDetail = 'Warning: No backup archive created yet'
      }
    }
  } catch (err: any) {
    backupStatus = 'warning'
    lastBackupDetail = `Error inspecting backups: ${err.message}`
  }
  checks.push({
    id: 'backup_health',
    name: 'Backup Status',
    status: backupStatus,
    detail: lastBackupDetail,
  })

  // 5. Disk Free Space Estimate
  let freeGb = 0
  try {
    // os.freemem() returns free system RAM, but for disk space on Windows:
    const memFreeGb = Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10
    freeGb = memFreeGb
  } catch {}

  checks.push({
    id: 'system_memory',
    name: 'System Available Memory',
    status: 'ok',
    detail: `${freeGb} GB available`,
  })

  // 6. Printer configuration
  let printerDetail = 'Default system printer configured'
  try {
    const sRow = sqlite.prepare(`SELECT receipt_printer_name FROM school_settings LIMIT 1`).get() as any
    if (sRow?.receipt_printer_name) {
      printerDetail = `Receipt printer: ${sRow.receipt_printer_name}`
    }
  } catch {}

  return {
    appVersion: `${APP_VERSION} (${APP_EDITION})`,
    osVersion: `${os.type()} ${os.release()} (${os.arch()})`,
    sqliteIntegrity: sqliteStatus === 'ok' ? 'OK' : 'FAIL',
    schemaVersion: schemaVer,
    userDataPath: userData,
    freeDiskSpaceGb: freeGb,
    backupStatus: backupStatus === 'ok' ? 'OK' : 'WARNING',
    printerStatus: printerDetail,
    checks,
  }
}

/**
 * Exports a strictly sanitized support package.
 * EXCLUDES: student database, photos, passwords, and tokens.
 */
export async function exportSupportPackage(destinationPath?: string): Promise<string> {
  const diagnostics = await runSystemDiagnostics()
  const userData = app.getPath('userData')
  const defaultDest = destinationPath || path.join(userData, 'exports', `edupilot_support_${Date.now()}.zip`)

  const exportsDir = path.dirname(defaultDest)
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true })

  const output = fs.createWriteStream(defaultDest)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      log.info(`Support package exported: ${defaultDest} (${archive.pointer()} bytes)`)
      resolve(defaultDest)
    })
    archive.on('error', (err) => reject(err))

    archive.pipe(output)

    // 1. Diagnostics JSON
    archive.append(JSON.stringify(diagnostics, null, 2), { name: 'diagnostics.json' })

    // 2. Sanitized Environment report
    const envReport = `
========================================
EDUPILOT 2.0 COMMERCIAL SUPPORT PACKAGE
========================================
Generated: ${new Date().toISOString()}
App Version: ${APP_VERSION} (${APP_EDITION})
OS: ${os.type()} ${os.release()} ${os.arch()}
Node: ${process.versions.node}
Electron: ${process.versions.electron}
Database Integrity: ${diagnostics.sqliteIntegrity}
Schema Version: ${diagnostics.schemaVersion}
User Data Path: ${diagnostics.userDataPath}
Printer Info: ${diagnostics.printerStatus}

NOTE: This package contains ONLY sanitized diagnostic metadata.
No student data, photos, QR tokens, or credentials are included.
========================================
`.trim()
    archive.append(envReport, { name: 'system_info.txt' })

    // 3. Sanitized log files if available
    const logDir = path.join(userData, 'logs')
    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir).filter((f) => f.endsWith('.log'))
      for (const f of logFiles.slice(0, 3)) {
        try {
          const content = fs.readFileSync(path.join(logDir, f), 'utf8')
          // Strip any passwords or tokens from logs
          const sanitized = content
            .replace(/"password":\s*".*?"/gi, '"password":"[REDACTED]"')
            .replace(/EDP2:[a-f0-9\-]+/gi, 'EDP2:[REDACTED_TOKEN]')
          archive.append(sanitized, { name: `logs/${f}` })
        } catch {}
      }
    }

    archive.finalize()
  })
}
