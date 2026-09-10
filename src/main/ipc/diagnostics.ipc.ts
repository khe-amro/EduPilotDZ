import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import { runSystemDiagnostics, exportSupportPackage } from '../services/diagnostics.service'
import { z } from 'zod'
import { dialog } from 'electron'

export function registerDiagnosticsHandlers(): void {
  handle(IPC_CHANNELS.DIAGNOSTICS_RUN, async () => {
    return runSystemDiagnostics()
  })

  handle(IPC_CHANNELS.DIAGNOSTICS_EXPORT_SUPPORT_PACKAGE, async (payload) => {
    const schema = z.object({
      destinationPath: z.string().optional(),
    }).optional()
    const parsed = schema.parse(payload ?? {})

    let destPath = parsed?.destinationPath
    if (!destPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const saveRes = await dialog.showSaveDialog({
        title: 'Save Edupilot Diagnostics Support Package',
        defaultPath: `edupilot-support-package-${timestamp}.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      })
      if (saveRes.canceled || !saveRes.filePath) {
        return { canceled: true }
      }
      destPath = saveRes.filePath
    }

    const zipPath = await exportSupportPackage(destPath)
    return { canceled: false, zipPath }
  })
}
