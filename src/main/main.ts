import { app, BrowserWindow, dialog } from 'electron'
import os from 'node:os'
import path from 'node:path'
import log from 'electron-log'
import { initializeDatabase, closeDatabase } from './database/connection'
import { runMigrations } from './database/migrator'
import { registerAllIpcHandlers } from './ipc/index'
import { createMainWindow } from './windows/mainWindow'
import { reconcilePastSessionsAttendance } from './services/attendance.service'
import { runDailyAutoBackup } from './services/backup.service'

import fs from 'node:fs'
import { USER_DATA_DIR_NAME, USER_DATA_DEV_DIR_NAME } from '../shared/constants/index'

log.initialize({ preload: true })
log.transports.file.level = 'info'
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

// Explicitly isolate Edupilot 2 Commercial user data from Edupilot 1.0.0
const baseDataDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
const appDataDir = path.join(
  baseDataDir,
  process.env.NODE_ENV !== 'production' ? USER_DATA_DEV_DIR_NAME : USER_DATA_DIR_NAME
)
app.setPath('userData', appDataDir)

// Ensure storage subdirectories exist
const requiredDirs = [
  path.join(appDataDir, 'database'),
  path.join(appDataDir, 'media', 'students'),
  path.join(appDataDir, 'media', 'teachers'),
  path.join(appDataDir, 'media', 'administrators'),
  path.join(appDataDir, 'media', 'guardians'),
  path.join(appDataDir, 'media', 'school'),
  path.join(appDataDir, 'media', 'documents'),
  path.join(appDataDir, 'backups'),
  path.join(appDataDir, 'logs'),
  path.join(appDataDir, 'config'),
  path.join(appDataDir, 'exports'),
]
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Single instance lock isolated to Edupilot 2 Commercial
const gotLock = app.requestSingleInstanceLock({ key: 'edupilot-commercial-v2' } as any)
if (!gotLock) {
  log.warn('Another instance of Edupilot 2 Commercial is already running — quitting')
  app.quit()
}

// Global exception and rejection diagnostics (Requirement 3)
process.on('uncaughtException', (error: Error) => {
  log.error(`[CRASH:uncaughtException] [${new Date().toISOString()}] [main]`, {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  })
})

process.on('unhandledRejection', (reason: unknown) => {
  log.error(`[CRASH:unhandledRejection] [${new Date().toISOString()}] [main]`, {
    reason: reason instanceof Error ? { name: reason.name, message: reason.message } : String(reason),
  })
})

let mainWindow: BrowserWindow | null = null

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('child-process-gone', (_event, details) => {
  log.error(`[CRASH:child-process-gone] [${new Date().toISOString()}] [${details.type}]`, {
    reason: details.reason,
    exitCode: details.exitCode,
    name: details.name,
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow()
  }
})

app.on('before-quit', () => {
  log.info('App quitting — closing database')
  try {
    closeDatabase()
  } catch { /* ignore */ }
})

async function bootstrap(): Promise<void> {
  await app.whenReady()

  log.info(`Edupilot 2 Commercial v${app.getVersion()} starting...`)
  log.info(`Electron: ${process.versions.electron}, Node: ${process.versions.node}`)
  log.info(`userData: ${app.getPath('userData')}`)

  try {
    // 1. Initialize database connection
    await initializeDatabase()

    // 2. Apply any pending migrations
    await runMigrations()

    // 3. Register all IPC handlers
    registerAllIpcHandlers()

    // 4. Create main window
    mainWindow = createMainWindow()

    // WebContents crash and failure monitoring (Requirement 3)
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      log.error(`[CRASH:render-process-gone] [${new Date().toISOString()}] [renderer]`, {
        reason: details.reason,
        exitCode: details.exitCode,
      })
    })

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      log.warn(`[WARN:did-fail-load] [${new Date().toISOString()}] [${errorCode}]`, {
        description: errorDescription,
        url: validatedURL,
      })
    })

    // 5. Run offline attendance reconciliation on startup (Requirement 16)
    try {
      await reconcilePastSessionsAttendance()
      log.info('Offline attendance reconciliation completed on startup')
    } catch (e) {
      log.warn('Attendance reconciliation startup error:', e)
    }

    // 6. Trigger daily auto-backup asynchronously (Requirement 53)
    try {
      runDailyAutoBackup().catch(e => log.warn('Auto backup background error:', e))
    } catch (e) {
      log.warn('Auto backup init error:', e)
    }

    log.info('Bootstrap complete')
  } catch (err) {
    log.error('Bootstrap failed:', err)
    // Show error dialog before quitting
    dialog.showErrorBox(
      'Startup Error',
      `Failed to initialize the application:\n\n${err instanceof Error ? err.message : String(err)}\n\nPlease check the logs.`
    )
    app.quit()
  }
}

bootstrap()
