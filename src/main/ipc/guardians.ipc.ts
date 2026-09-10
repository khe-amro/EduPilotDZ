import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import {
  listGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  getFamilySummary,
  linkStudentGuardian,
  unlinkStudentGuardian,
  getGuardiansForStudent,
} from '../services/guardians.service'
import { z } from 'zod'

export function registerGuardianHandlers(): void {
  handle(IPC_CHANNELS.GUARDIANS_LIST, async (payload) => {
    const schema = z.object({
      search: z.string().optional(),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().nonnegative().optional(),
    }).optional()
    const opts = schema.parse(payload ?? {})
    return listGuardians(opts)
  })

  handle(IPC_CHANNELS.GUARDIANS_GET, async (payload) => {
    const { id } = z.object({ id: z.number().int().positive() }).parse(payload)
    return getGuardianById(id)
  })

  handle(IPC_CHANNELS.GUARDIANS_CREATE, async (payload) => {
    const schema = z.object({
      fullName: z.string().min(1).max(100),
      phone: z.string().max(20).optional().nullable(),
      whatsappPhone: z.string().max(20).optional().nullable(),
      email: z.string().email().optional().nullable(),
      address: z.string().max(200).optional().nullable(),
      notes: z.string().max(500).optional().nullable(),
    })
    const data = schema.parse(payload)
    return createGuardian(data)
  })

  handle(IPC_CHANNELS.GUARDIANS_UPDATE, async (payload) => {
    const schema = z.object({
      id: z.number().int().positive(),
      fullName: z.string().min(1).max(100).optional(),
      phone: z.string().max(20).optional().nullable(),
      whatsappPhone: z.string().max(20).optional().nullable(),
      email: z.string().email().optional().nullable(),
      address: z.string().max(200).optional().nullable(),
      notes: z.string().max(500).optional().nullable(),
    })
    const { id, ...rest } = schema.parse(payload)
    return updateGuardian(id, rest)
  })

  handle(IPC_CHANNELS.GUARDIANS_DELETE, async (payload) => {
    const { id } = z.object({ id: z.number().int().positive() }).parse(payload)
    return deleteGuardian(id)
  })

  handle(IPC_CHANNELS.GUARDIANS_FAMILY_SUMMARY, async (payload) => {
    const { guardianId } = z.object({ guardianId: z.number().int().positive() }).parse(payload)
    return getFamilySummary(guardianId)
  })

  handle('guardians:linkStudent', async (payload) => {
    const schema = z.object({
      studentId: z.number().int().positive(),
      guardianId: z.number().int().positive(),
      relationship: z.string().max(50).optional(),
      isPrimaryContact: z.boolean().optional(),
      isEmergencyContact: z.boolean().optional(),
    })
    const data = schema.parse(payload)
    return linkStudentGuardian(data)
  })

  handle('guardians:unlinkStudent', async (payload) => {
    const schema = z.object({
      studentId: z.number().int().positive(),
      guardianId: z.number().int().positive(),
    })
    const data = schema.parse(payload)
    return unlinkStudentGuardian(data.studentId, data.guardianId)
  })

  handle('guardians:forStudent', async (payload) => {
    const { studentId } = z.object({ studentId: z.number().int().positive() }).parse(payload)
    return getGuardiansForStudent(studentId)
  })
}
