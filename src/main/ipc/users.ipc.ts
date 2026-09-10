import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../services/users.service'
import type { UserRole } from '../../shared/types/index'
import { z } from 'zod'

const UserRoleEnum = z.enum(['owner', 'superadmin', 'admin', 'secretary', 'registrar', 'accountant', 'teacher', 'viewer'])

export function registerUserHandlers(): void {
  handle(IPC_CHANNELS.AUTH_LIST_USERS, async () => {
    return listAdminUsers()
  })

  handle(IPC_CHANNELS.AUTH_CREATE_USER, async (payload) => {
    const schema = z.object({
      username: z.string().min(3).max(50),
      fullName: z.string().min(2).max(100),
      role: UserRoleEnum,
      password: z.string().min(6),
      preferredLanguage: z.enum(['ar', 'fr', 'en']).optional(),
    })
    const data = schema.parse(payload)
    return createAdminUser({
      ...data,
      role: data.role as UserRole,
    })
  })

  handle(IPC_CHANNELS.AUTH_UPDATE_USER, async (payload) => {
    const schema = z.object({
      id: z.number().int().positive(),
      fullName: z.string().min(2).max(100).optional(),
      role: UserRoleEnum.optional(),
      preferredLanguage: z.enum(['ar', 'fr', 'en']).optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    })
    const { id, ...data } = schema.parse(payload)
    return updateAdminUser(id, {
      ...data,
      role: data.role ? (data.role as UserRole) : undefined,
    })
  })

  handle(IPC_CHANNELS.AUTH_DELETE_USER, async (payload) => {
    const { id } = z.object({ id: z.number().int().positive() }).parse(payload)
    return deleteAdminUser(id)
  })
}
