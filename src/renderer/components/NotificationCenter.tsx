import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info, Check, X, ShieldAlert, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SystemNotification {
  id: string
  type: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  actionLink?: string
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const loadNotifications = async () => {
    try {
      const res = await window.schoolApp?.notifications?.list?.()
      if (res && res.success && res.data) {
        setNotifications(res.data)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000) // refresh every min
    return () => clearInterval(interval)
  }, [])

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
    try {
      await window.schoolApp?.notifications?.dismiss?.(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {}
  }

  const handleAction = (notif: SystemNotification) => {
    if (notif.actionLink) {
      setIsOpen(false)
      navigate(notif.actionLink)
    }
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
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        title="Notifications & System Health"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                System Alerts
              </span>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  {notifications.length}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Check className="w-6 h-6 text-green-500 mx-auto mb-1.5 opacity-80" />
                <p className="text-xs font-medium text-slate-600">All systems operational</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No critical alerts or pending warnings.</p>
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
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                      {getIcon(n.severity, n.type)}
                      <span>{n.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDismiss(n.id, e)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.actionLink && (
                    <div className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View details &rarr;
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 text-[10px] text-slate-400 text-center">
            Edupilot 2.0 Local Guardian Health Monitor
          </div>
        </div>
      )}
    </div>
  )
}
