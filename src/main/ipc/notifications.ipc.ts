import { handle } from './_handler'
import { IPC_CHANNELS } from '../../shared/constants/index'
import { getSystemNotifications, dismissNotification } from '../services/notifications.service'
import { z } from 'zod'

export function registerNotificationHandlers(): void {
  handle(IPC_CHANNELS.NOTIFICATIONS_LIST, async () => {
    return getSystemNotifications()
  })

  handle(IPC_CHANNELS.NOTIFICATIONS_DISMISS, async (payload) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(payload)
    return dismissNotification(id)
  })
}
