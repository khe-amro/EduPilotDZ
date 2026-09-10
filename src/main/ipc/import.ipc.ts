import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import { parseFileForPreview, executeImport } from '../services/import.service'
import { z } from 'zod'
import { dialog } from 'electron'

export function registerImportHandlers(): void {
  handle(IPC_CHANNELS.IMPORT_PREVIEW, async (payload) => {
    const schema = z.object({
      filePath: z.string().optional(),
    }).optional()
    const parsed = schema.parse(payload ?? {})

    let filePath = parsed?.filePath
    if (!filePath) {
      const res = await dialog.showOpenDialog({
        title: 'Select Student Import File (CSV or Excel)',
        filters: [
          { name: 'Spreadsheets', extensions: ['xlsx', 'csv'] },
          { name: 'Excel Workbook', extensions: ['xlsx'] },
          { name: 'CSV File', extensions: ['csv'] },
        ],
        properties: ['openFile'],
      })
      if (res.canceled || !res.filePaths[0]) {
        return null
      }
      filePath = res.filePaths[0]
    }

    const preview = await parseFileForPreview(filePath)
    return { ...preview, filePath }
  })

  handle(IPC_CHANNELS.IMPORT_EXECUTE, async (payload) => {
    const schema = z.object({
      filePath: z.string().min(1),
      mapping: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        guardianName: z.string().optional(),
        guardianPhone: z.string().optional(),
        groupName: z.string().optional(),
        gender: z.string().optional(),
        dateOfBirth: z.string().optional(),
        address: z.string().optional(),
      }),
      options: z.object({
        skipHeader: z.boolean().optional(),
        defaultGender: z.enum(['male', 'female']).optional(),
        createCards: z.boolean().optional(),
        autoLinkGroups: z.boolean().optional(),
      }).optional(),
    })
    const data = schema.parse(payload)
    return executeImport(data.filePath, data.mapping, data.options)
  })
}
