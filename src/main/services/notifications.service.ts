import { getSqlite } from '../database/connection'
import { listBackups } from './backup.service'
import { getStudentsDebtReport } from './payment.service'

export interface SystemNotification {
  id: string
  type: 'debt' | 'backup' | 'schedule' | 'card' | 'system'
  title: string
  message: string
  titleAr?: string
  messageAr?: string
  titleFr?: string
  messageFr?: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  actionLink?: string
  meta?: Record<string, any>
}

const dismissedIds = new Set<string>()

export async function getSystemNotifications(): Promise<SystemNotification[]> {
  const sqlite = getSqlite()
  const notifications: SystemNotification[] = []

  // 1. Check for Students with Outstanding Tuition Debt (using canonical debt engine)
  try {
    const debtReport = await getStudentsDebtReport()
    const overdueStudents = debtReport.filter((item) => (item.totalDebt || 0) > 0)
    const totalDebt = overdueStudents.reduce((acc, r) => acc + (r.totalDebt || 0), 0)

    if (overdueStudents.length > 0 && totalDebt > 0) {
      notifications.push({
        id: `debt_summary_${overdueStudents.length}_${totalDebt}`,
        type: 'debt',
        title: 'Outstanding Student Debt',
        message: `${overdueStudents.length} active student(s) currently have outstanding balances totaling ${totalDebt.toLocaleString()} DZD.`,
        titleAr: 'مستحقات طلابية غير مسددة',
        messageAr: `يوجد ${overdueStudents.length} تلميذ لديهم مستحقات مالية غير مسددة بإجمالي ${totalDebt.toLocaleString()} دج.`,
        titleFr: 'Créances élèves impayées',
        messageFr: `${overdueStudents.length} élève(s) ont des soldes débiteurs pour un total de ${totalDebt.toLocaleString()} DZD.`,
        severity: totalDebt > 50000 ? 'critical' : 'warning',
        timestamp: new Date().toISOString(),
        actionLink: '/payments',
        meta: { count: overdueStudents.length, totalDebt },
      })
    }
  } catch (err) {
    console.error('Failed to compute debt notifications:', err)
  }

  // 2. Check Backup Health
  try {
    const backups = await listBackups()
    if (backups.length === 0) {
      notifications.push({
        id: 'no_backups_warning',
        type: 'backup',
        title: 'No Database Backups Found',
        message: 'No system backups have been created yet. Create an offline snapshot to safeguard school data.',
        titleAr: 'لم يتم العثور على نسخ احتياطية',
        messageAr: 'لم يتم إنشاء أي نسخة احتياطية بعد. يُرجى إنشاء نسخة احتياطية فوراً لحماية بيانات المؤسسة.',
        titleFr: 'Aucune sauvegarde trouvée',
        messageFr: 'Aucune sauvegarde système n\'a été créée. Créez un instantané hors ligne pour protéger vos données.',
        severity: 'critical',
        timestamp: new Date().toISOString(),
        actionLink: '/settings',
      })
    } else {
      const latest = backups[0]
      const latestDate = new Date(latest.createdAt).getTime()
      const daysSince = (Date.now() - latestDate) / (1000 * 60 * 60 * 24)
      if (daysSince > 7) {
        notifications.push({
          id: `backup_overdue_${Math.floor(daysSince)}`,
          type: 'backup',
          title: 'Database Backup Overdue',
          message: `The last database backup was created ${Math.floor(daysSince)} days ago (${latest.createdAt.slice(0, 10)}). Recommended backup interval is weekly.`,
          titleAr: 'النسخة الاحتياطية متأخرة',
          messageAr: `آخر نسخة احتياطية أُنشئت منذ ${Math.floor(daysSince)} يوماً (${latest.createdAt.slice(0, 10)}). يُوصى بأخذ نسخة أسبوعياً.`,
          titleFr: 'Sauvegarde en retard',
          messageFr: `La dernière sauvegarde date de ${Math.floor(daysSince)} jours (${latest.createdAt.slice(0, 10)}). L'intervalle recommandé est hebdomadaire.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          actionLink: '/settings',
        })
      }
    }
  } catch {}

  // 3. Check Cards Expiring or Issues
  try {
    const expiringRows = sqlite.prepare(`
      SELECT count(*) as cnt
      FROM student_cards
      WHERE status = 'ACTIVE'
        AND expires_at IS NOT NULL
        AND date(expires_at) <= date('now', '+30 days')
        AND date(expires_at) >= date('now')
    `).get() as any

    if (expiringRows && expiringRows.cnt > 0) {
      notifications.push({
        id: `cards_expiring_${expiringRows.cnt}`,
        type: 'card',
        title: 'Student Cards Expiring Soon',
        message: `${expiringRows.cnt} active student cards will expire within the next 30 days.`,
        titleAr: 'بطاقات طلابية قريبة الانتهاء',
        messageAr: `تنتهي صلاحية ${expiringRows.cnt} بطاقة مدرسية نشطة خلال الـ 30 يوماً القادمة.`,
        titleFr: 'Cartes élèves expirant bientôt',
        messageFr: `${expiringRows.cnt} cartes actives expireront dans les 30 prochains jours.`,
        severity: 'info',
        timestamp: new Date().toISOString(),
        actionLink: '/students',
      })
    }
  } catch {}

  // 4. Check Schedule Room Conflicts
  try {
    const conflictRows = sqlite.prepare(`
      SELECT s1.id as s1_id, s2.id as s2_id, s1.room, s1.weekday, g1.name as group1, g2.name as group2
      FROM schedules s1
      JOIN schedules s2 ON s1.weekday = s2.weekday 
        AND s1.id < s2.id
        AND s1.room IS NOT NULL 
        AND s1.room != '' 
        AND s1.room = s2.room
        AND s1.is_active = 1 
        AND s2.is_active = 1
        AND (
          (s1.start_time <= s2.start_time AND s1.end_time > s2.start_time)
          OR (s2.start_time <= s1.start_time AND s2.end_time > s1.start_time)
        )
      JOIN groups g1 ON s1.group_id = g1.id
      JOIN groups g2 ON s2.group_id = g2.id
      LIMIT 3
    `).all() as any[]

    if (conflictRows.length > 0) {
      notifications.push({
        id: `schedule_conflict_${conflictRows[0].s1_id}_${conflictRows[0].s2_id}`,
        type: 'schedule',
        title: 'Room Schedule Conflict Detected',
        message: `Conflict in Room "${conflictRows[0].room}": Group "${conflictRows[0].group1}" and "${conflictRows[0].group2}" overlap in weekly timetable.`,
        titleAr: 'تعارض في توقيت القاعات',
        messageAr: `تعارض في القاعة "${conflictRows[0].room}": يتداخل توقيت الفوجين "${conflictRows[0].group1}" و "${conflictRows[0].group2}".`,
        titleFr: 'Conflit de salle détecté',
        messageFr: `Conflit en salle "${conflictRows[0].room}" : les groupes "${conflictRows[0].group1}" et "${conflictRows[0].group2}" se chevauchent.`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        actionLink: '/schedules',
      })
    }
  } catch {}

  // Filter out dismissed
  return notifications.filter((n) => !dismissedIds.has(n.id))
}

export function dismissNotification(id: string): boolean {
  dismissedIds.add(id)
  return true
}
