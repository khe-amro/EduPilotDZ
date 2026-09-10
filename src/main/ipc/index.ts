import { registerAuthHandlers } from './auth.ipc'
import { registerStudentHandlers } from './students.ipc'
import { registerAttendanceHandlers } from './attendance.ipc'
import { registerEntityHandlers } from './entities.ipc'
import { registerPaymentHandlers } from './payments.ipc'
import { registerUtilityHandlers } from './utility.ipc'
import { registerSchedulesHandlers } from './schedules.ipc'
import { registerSessionsHandlers } from './sessions.ipc'
import { registerMediaHandlers } from './media.ipc'
import { registerNotesHandlers } from './notes.ipc'
import { registerPrinterHandlers } from './printer.ipc'
import { registerGuardianHandlers } from './guardians.ipc'
import { registerCardHandlers } from './cards.ipc'
import { registerDocumentHandlers } from './documents.ipc'
import { registerWhatsAppHandlers } from './whatsapp.ipc'
import { registerImportHandlers } from './import.ipc'
import { registerDiagnosticsHandlers } from './diagnostics.ipc'
import { registerSearchHandlers } from './search.ipc'
import { registerNotificationHandlers } from './notifications.ipc'
import { registerUserHandlers } from './users.ipc'
import log from 'electron-log'

export function registerAllIpcHandlers(): void {
  registerAuthHandlers()
  registerStudentHandlers()
  registerEntityHandlers()
  registerAttendanceHandlers()
  registerPaymentHandlers()
  registerUtilityHandlers()
  registerSchedulesHandlers()
  registerSessionsHandlers()
  registerMediaHandlers()
  registerNotesHandlers()
  registerPrinterHandlers()
  registerGuardianHandlers()
  registerCardHandlers()
  registerDocumentHandlers()
  registerWhatsAppHandlers()
  registerImportHandlers()
  registerDiagnosticsHandlers()
  registerSearchHandlers()
  registerNotificationHandlers()
  registerUserHandlers()
  log.info('All IPC handlers registered (Edupilot 2.0 Commercial)')
}
