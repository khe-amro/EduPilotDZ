import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info, Check, X, ShieldAlert, Calendar } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface SystemNotification {
  id: string
  type: string
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

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const lang = (i18n.language || 'ar') as 'ar' | 'fr' | 'en'

  const getStoredDismissed = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('edupilot_dismissed_notifications') || '[]')
    } catch {
      return []
    }
  }

  const saveDismissedId = (id: string) => {
    try {
      const current = getStoredDismissed()
      if (!current.includes(id)) {
        current.push(id)
        localStorage.setItem('edupilot_dismissed_notifications', JSON.stringify(current))
      }
    } catch {}
  }

  const saveDismissedIds = (ids: string[]) => {
    try {
      const current = getStoredDismissed()
      const merged = Array.from(new Set([...current, ...ids]))
      localStorage.setItem('edupilot_dismissed_notifications', JSON.stringify(merged))
    } catch {}
  }

  const loadNotifications = useCallback(async () => {
    try {
      const res = await window.schoolApp?.notifications?.list?.()
      if (res && res.success && Array.isArray(res.data)) {
        const dismissed = getStoredDismissed()
        let active = res.data.filter((n: SystemNotification) => !dismissed.includes(n.id))

        // Double check real-time debt report to guarantee 100% sync if student has already paid
        const hasDebtNotif = active.some((n) => n.type === 'debt')
        if (hasDebtNotif) {
          try {
            const debtRes = await window.schoolApp?.payments?.debtReport?.()
            if (debtRes && debtRes.success && Array.isArray(debtRes.data)) {
              const overdue = debtRes.data.filter((item: any) => (item.totalDebt || 0) > 0)
              const realTotalDebt = overdue.reduce((sum: number, item: any) => sum + (item.totalDebt || 0), 0)
              if (overdue.length === 0 || realTotalDebt <= 0) {
                active = active.filter((n) => n.type !== 'debt')
              }
            }
          } catch {
            // ignore
          }
        }

        setNotifications(active)
      }
    } catch {
      // ignore
    }
  }, [])

  // Sync on initial mount, periodic interval, window focus, and custom app events
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    const handleRefresh = () => loadNotifications()
    window.addEventListener('app:notifications-refresh', handleRefresh)
    window.addEventListener('focus', handleRefresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('app:notifications-refresh', handleRefresh)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [loadNotifications])

  // Sync automatically when navigating between views (e.g. from Payments back to Dashboard)
  useEffect(() => {
    loadNotifications()
  }, [location.pathname, loadNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    saveDismissedId(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await window.schoolApp?.notifications?.dismiss?.(id)
    } catch {}
  }

  const handleClearAll = async () => {
    const ids = notifications.map((n) => n.id)
    saveDismissedIds(ids)
    setNotifications([])
    for (const id of ids) {
      try {
        await window.schoolApp?.notifications?.dismiss?.(id)
      } catch {}
    }
  }

  const handleAction = (notif: SystemNotification) => {
    if (notif.actionLink) {
      setIsOpen(false)
      navigate(notif.actionLink)
    }
  }

  const getTitle = (n: SystemNotification) => {
    if (lang === 'ar' && n.titleAr) return n.titleAr
    if (lang === 'fr' && n.titleFr) return n.titleFr
    return n.title
  }

  const getMessage = (n: SystemNotification) => {
    if (lang === 'ar' && n.messageAr) return n.messageAr
    if (lang === 'fr' && n.messageFr) return n.messageFr
    return n.message
  }

  const getIcon = (severity: string, type: string) => {
    if (type === 'backup') return <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
    if (type === 'schedule') return <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
    if (severity === 'critical') return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
    if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
    return <Info className="w-4 h-4 text-blue-500 shrink-0" />
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          if (next) loadNotifications()
        }}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        title={isRTL ? 'التنبيهات وصحة النظام' : 'Notifications & System Health'}
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isRTL ? 'left-0' : 'right-0'
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                {isRTL ? 'تنبيهات النظام' : lang === 'fr' ? 'Alertes système' : 'System Alerts'}
              </span>
              {notifications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                  {notifications.length}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                {isRTL ? 'مسح الكل' : lang === 'fr' ? 'Tout effacer' : 'Clear all'}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Check className="w-6 h-6 text-green-500 mx-auto mb-1.5 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">
                  {isRTL ? 'جميع الأنظمة تعمل بشكل سليم' : lang === 'fr' ? 'Tous les systèmes sont opérationnels' : 'All systems operational'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isRTL ? 'لا توجد تنبيهات عاجلة أو ديون معلقة.' : lang === 'fr' ? 'Aucune alerte critique ou solde débiteur.' : 'No critical alerts or pending warnings.'}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleAction(n)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    n.severity === 'critical'
                      ? 'bg-red-50/60 border-red-200/80 hover:bg-red-50'
                      : n.severity === 'warning'
                      ? 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      {getIcon(n.severity, n.type)}
                      <span>{getTitle(n)}</span>
                    </div>
                    <button
                      onClick={(e) => handleDismiss(n.id, e)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm cursor-pointer"
                      title={isRTL ? 'إغلاق' : 'Dismiss'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{getMessage(n)}</p>
                  {n.actionLink && (
                    <div className="mt-2 text-[11px] font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1">
                      {isRTL ? 'عرض التفاصيل ←' : lang === 'fr' ? 'Voir détails →' : 'View details →'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 text-[10px] text-slate-400 text-center font-medium">
            {isRTL ? 'نظام مراقبة صحة واستقرار المؤسسة — EduPilot DZ' : 'Edupilot 2.0 Local Guardian Health Monitor'}
          </div>
        </div>
      )}
    </div>
  )
}
