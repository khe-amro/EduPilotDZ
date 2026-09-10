import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import {
  listStudentDocuments,
  uploadStudentDocument,
  deleteStudentDocument,
  getDocumentFilePath,
} from '../services/documents.service'
import { z } from 'zod'
import { dialog, shell } from 'electron'

export function registerDocumentHandlers(): void {
  handle(IPC_CHANNELS.DOCUMENTS_LIST, async (payload) => {
    const { studentId } = z.object({ studentId: z.number().int().positive() }).parse(payload)
    return listStudentDocuments(studentId)
  })

  handle(IPC_CHANNELS.DOCUMENTS_UPLOAD, async (payload) => {
    const schema = z.object({
      studentId: z.number().int().positive(),
      documentType: z.enum(['id_card', 'birth_certificate', 'medical_certificate', 'enrollment_form', 'registration_form', 'contract', 'medical', 'other']),
      sourceFilePath: z.string().optional(),
      customName: z.string().max(100).optional(),
    })
    const data = schema.parse(payload)

    let filePath = data.sourceFilePath
    if (!filePath) {
      const result = await dialog.showOpenDialog({
        title: 'Select Document to Upload',
        filters: [
          { name: 'Documents', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'doc'] },
        ],
        properties: ['openFile'],
      })
      if (result.canceled || !result.filePaths[0]) {
        return null
      }
      filePath = result.filePaths[0]
    }

    return uploadStudentDocument(data.studentId, data.documentType as any, filePath, data.customName)
  })

  handle(IPC_CHANNELS.DOCUMENTS_DELETE, async (payload) => {
    const { documentId } = z.object({ documentId: z.number().int().positive() }).parse(payload)
    return deleteStudentDocument(documentId)
  })

  handle(IPC_CHANNELS.DOCUMENTS_GET_URL, async (payload) => {
    const { documentId } = z.object({ documentId: z.number().int().positive() }).parse(payload)
    const filePath = await getDocumentFilePath(documentId)
    try {
      await shell.openPath(filePath)
    } catch {
      // ignore
    }
    return { filePath }
  })
}

