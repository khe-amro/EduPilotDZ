import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import {
  Save, School, Wrench, Database, Shield,
  Eye, EyeOff, CheckCircle2, AlertCircle, FolderOpen,
  RotateCcw, Plus, Clock, User, KeyRound, AlertTriangle, Check, Camera, Printer,
  Users, CreditCard, MessageCircle, Activity, Info, Download, Trash2, Edit2, ExternalLink, HardDrive, Sparkles, X
} from 'lucide-react'
import type { SchoolSettings, PrinterInfo, WhatsAppTemplate, DiagnosticsReport, AdminRole, Language } from '@shared/types/index'

type SettingsSection = 'school' | 'application' | 'users' | 'billing' | 'whatsapp' | 'diagnostics' | 'printing' | 'backup' | 'security' | 'about'

interface AuditLog {
  id: number
  adminName: string
  action: string
  entityType?: string
  entityId?: number
  createdAt: string
}

export default function Settings() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'ar' | 'fr' | 'en'
  const navigate = useNavigate()
  const { logout, refreshSession } = useAuth()
  const [section, setSection] = useState<SettingsSection>('school')
  const [settings, setSettings] = useState<Partial<SchoolSettings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // School logo preview
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)

  // Users (RBAC)
  const [usersList, setUsersList] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('admin')
  const [newLang, setNewLang] = useState<Language>('ar')
  const [userModalError, setUserModalError] = useState('')
  const [savingUser, setSavingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editRole, setEditRole] = useState<AdminRole>('admin')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editPassword, setEditPassword] = useState('')

  // WhatsApp Templates
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [tplBodyAr, setTplBodyAr] = useState('')
  const [tplBodyFr, setTplBodyFr] = useState('')
  const [tplBodyEn, setTplBodyEn] = useState('')
  const [tplIsActive, setTplIsActive] = useState(true)
  const [savingTpl, setSavingTpl] = useState(false)

  // Diagnostics
  const [diagReport, setDiagReport] = useState<DiagnosticsReport | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [exportingSupport, setExportingSupport] = useState(false)
  const [supportZipPath, setSupportZipPath] = useState<string | null>(null)

  // Admin profile
  const [admin, setAdmin] = useState<{ id?: number; fullName: string; username: string; preferredLanguage: string; photoPath: string | null } | null>(null)
  const [adminPhotoUrl, setAdminPhotoUrl] = useState<string | null>(null)
  const [adminForm, setAdminForm] = useState({ fullName: '', username: '' })
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminSaveStatus, setAdminSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [adminError, setAdminError] = useState('')

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

  // Auto-lock
  const [autoLockMinutes, setAutoLockMinutes] = useState(0)

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Printing state
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [printersLoading, setPrintersLoading] = useState(false)
  const [testPrintStatus, setTestPrintStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [testPrintError, setTestPrintError] = useState<string | null>(null)

  // Backups
  const [backups, setBackups] = useState<any[]>([])
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<{ path: string; name: string } | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [settingsRes, adminRes, lockRes] = await Promise.all([
        window.schoolApp.settings.get(),
        window.schoolApp.settings.getAdmin(),
        window.schoolApp.settings.getAutoLock(),
      ])
      if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data)
      if (adminRes.success && adminRes.data) {
        setAdmin(adminRes.data)
        setAdminForm({
          fullName: adminRes.data.fullName || '',
          username: adminRes.data.username || '',
        })
        if (adminRes.data.photoPath) {
          try {
            const photoRes = await window.schoolApp.media.getImageUrl(adminRes.data.photoPath)
            if (photoRes.success && photoRes.data?.url) setAdminPhotoUrl(photoRes.data.url)
          } catch { /* ignore */ }
        }
      }
      if (lockRes.success && lockRes.data) setAutoLockMinutes(lockRes.data.minutes ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const currentLogo = settings.logoPath || settings.schoolLogoPath
    if (currentLogo) {
      window.schoolApp.media.getImageUrl(currentLogo).then(res => {
        if (res.success && res.data?.url) setLogoPreviewUrl(res.data.url)
      }).catch(() => {})
    } else {
      setLogoPreviewUrl(null)
    }
  }, [settings.logoPath, settings.schoolLogoPath])

  const handleSelectSchoolLogo = async () => {
    try {
      const res = await window.schoolApp.media.selectImage('admin', 'school_logo')
      if (res.success && res.data?.path) {
        const path = res.data.path
        setSettings((s) => ({ ...s, logoPath: path, schoolLogoPath: path }))
        const urlRes = await window.schoolApp.media.getImageUrl(path)
        if (urlRes.success && urlRes.data?.url) setLogoPreviewUrl(urlRes.data.url)
      }
    } catch { /* ignore */ }
  }

  const loadBackups = useCallback(async () => {
    const res = await window.schoolApp.backups.list()
    if (res.success && res.data) setBackups(res.data)
  }, [])

  const loadPrinters = useCallback(async () => {
    setPrintersLoading(true)
    try {
      const res = await window.schoolApp.printer.getList()
      if (res.success && res.data) {
        setPrinters(res.data)
      }
    } catch {
      // ignore
    } finally {
      setPrintersLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await window.schoolApp.users.list()
      if (res.success && res.data) setUsersList(res.data)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    try {
      const res = await window.schoolApp.whatsapp.getTemplates()
      if (res.success && res.data) setTemplates(res.data)
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  const runDiagnostics = useCallback(async () => {
    setDiagLoading(true)
    try {
      const res = await window.schoolApp.diagnostics.run()
      if (res.success && res.data) setDiagReport(res.data)
    } finally {
      setDiagLoading(false)
    }
  }, [])

  useEffect(() => {
    if (section === 'backup') loadBackups()
    if (section === 'security') loadAuditLogs()
    if (section === 'printing') loadPrinters()
    if (section === 'users') loadUsers()
    if (section === 'whatsapp') loadTemplates()
    if (section === 'diagnostics') runDiagnostics()
  }, [section, loadBackups, loadPrinters, loadUsers, loadTemplates, runDiagnostics])

  const handleSaveNewUser = async () => {
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) {
      setUserModalError(t('auth.fillAllFields') || 'Veuillez remplir tous les champs')
      return
    }
    setSavingUser(true)
    setUserModalError('')
    try {
      const res = await window.schoolApp.users.create({
        username: newUsername.trim(),
        fullName: newFullName.trim(),
        password: newPassword,
        role: newRole,
        preferredLanguage: newLang,
      })
      if (res.success) {
        setShowAddUserModal(false)
        setNewUsername('')
        setNewFullName('')
        setNewPassword('')
        await loadUsers()
      } else {
        setUserModalError((res as any).error || 'Failed to create user')
      }
    } catch (e: any) {
      setUserModalError(e.message || 'Error creating user')
    } finally {
      setSavingUser(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    setSavingUser(true)
    try {
      const updateData: any = {
        role: editRole,
        isActive: editIsActive,
      }
      if (editPassword.trim()) {
        updateData.password = editPassword.trim()
      }
      const res = await window.schoolApp.users.update(editingUser.id, updateData)
      if (res.success) {
        setEditingUser(null)
        setEditPassword('')
        await loadUsers()
      } else {
        alert((res as any).error || 'Failed to update user')
      }
    } catch (e: any) {
      alert(e.message || 'Error updating user')
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (admin && (admin as any).id === userId) {
      alert(lang === 'ar' ? 'لا يمكن حذف الحساب الحالي المسجل به' : 'Cannot delete the current active user')
      return
    }
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم نهائياً؟' : 'Delete this user permanently?')) return
    try {
      const res = await window.schoolApp.users.delete(userId)
      if (res.success) {
        await loadUsers()
      } else {
        alert((res as any).error || 'Failed to delete user')
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting user')
    }
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return
    setSavingTpl(true)
    try {
      const res = await window.schoolApp.whatsapp.updateTemplate(editingTemplate.id, {
        bodyAr: tplBodyAr,
        bodyFr: tplBodyFr,
        bodyEn: tplBodyEn,
        isActive: tplIsActive,
      })
      if (res.success) {
        setEditingTemplate(null)
        await loadTemplates()
      } else {
        alert((res as any).error || 'Failed to update template')
      }
    } catch (e: any) {
      alert(e.message || 'Error updating template')
    } finally {
      setSavingTpl(false)
    }
  }

  const handleExportSupport = async () => {
    setExportingSupport(true)
    setSupportZipPath(null)
    try {
      const res = await window.schoolApp.diagnostics.exportSupportPackage()
      if (res.success && res.data?.zipPath) {
        setSupportZipPath(res.data.zipPath)
      }
    } catch (e: any) {
      alert(e.message || 'Error exporting support package')
    } finally {
      setExportingSupport(false)
    }
  }

  const loadAuditLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await window.schoolApp.settings.listAuditLogs({ limit: 50 })
      if (res.success && res.data) setAuditLogs(res.data)
    } finally {
      setLogsLoading(false)
    }
  }

  const set = (k: keyof SchoolSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings((s) => ({ ...s, [k]: e.target.value }))

  const setChecked = (k: keyof SchoolSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((s) => ({ ...s, [k]: e.target.checked }))

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await window.schoolApp.settings.update({
        schoolNameAr: settings.schoolNameAr,
        schoolNameFr: settings.schoolNameFr,
        schoolNameEn: settings.schoolNameEn,
        phone: settings.phone ?? null,
        email: settings.email ?? null,
        address: settings.address ?? null,
        academicYear: settings.academicYear,
        currency: settings.currency,
        defaultLanguage: settings.defaultLanguage as 'ar' | 'fr' | 'en',
        backupDirectory: settings.backupDirectory ?? null,
        automaticBackupEnabled: settings.automaticBackupEnabled,
        backupsToRetain: settings.backupsToRetain,
        receiptPrinterName: settings.receiptPrinterName ?? null,
        receiptPaperWidth: settings.receiptPaperWidth || '80mm',
        autoPrintReceipt: Boolean(settings.autoPrintReceipt),
        showPrintDialog: settings.showPrintDialog !== false,
        logoPath: settings.logoPath || settings.schoolLogoPath || null,
        schoolLogoPath: settings.logoPath || settings.schoolLogoPath || null,
        headerSubtitle: settings.headerSubtitle ?? null,
      })
      if (res.success && res.data) {
        setSettings(res.data)
        const savedLogo = res.data.logoPath || res.data.schoolLogoPath
        if (savedLogo) {
          window.schoolApp.media.getImageUrl(savedLogo).then(r => {
            if (r.success && r.data?.url) setLogoPreviewUrl(r.data.url)
          }).catch(() => {})
        }
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTestPrint = async () => {
    setTestPrintStatus('loading')
    setTestPrintError(null)
    try {
      const res = await window.schoolApp.printer.printTest()
      if (res.success) {
        setTestPrintStatus('success')
        setTimeout(() => setTestPrintStatus('idle'), 4000)
      } else {
        setTestPrintStatus('error')
        setTestPrintError(res.error || t('settings.testPrintFailed'))
      }
    } catch (err: any) {
      setTestPrintStatus('error')
      setTestPrintError(err?.message || t('settings.testPrintFailed'))
    }
  }

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) { setPwError(t('auth.fillAllFields')); return }
    if (pwForm.next !== pwForm.confirm) { setPwError(t('setup.errorPasswordMismatch')); return }
    if (pwForm.next.length < 6) { setPwError(t('setup.errorPasswordLength')); return }
    setPwError('')
    try {
      const res = await window.schoolApp.auth.changePassword(pwForm.current, pwForm.next)
      if (res.success) {
        setPwStatus('success')
        setPwForm({ current: '', next: '', confirm: '' })
        setTimeout(() => setPwStatus('idle'), 3000)
      } else {
        setPwError(res.error ?? t('common.error'))
        setPwStatus('error')
      }
    } catch (e: any) {
      setPwError(e.message ?? t('common.error'))
      setPwStatus('error')
    }
  }

  const handleChooseBackupDir = async () => {
    const res = await window.schoolApp.app.openSaveDialog()
    if (res.success && res.data && !res.data.canceled && res.data.path) {
      setSettings((s) => ({ ...s, backupDirectory: res.data!.path! }))
    }
  }

  const handleCreateBackup = async () => {
    setCreating(true)
    setBackupStatus(null)
    try {
      const res = await window.schoolApp.backups.create(settings.backupDirectory ?? undefined)
      if (res.success) {
        setBackupStatus(t('backups.backupCreated'))
        await loadBackups()
      } else {
        setBackupStatus(`${t('common.error')}: ${res.error}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRestoreBackup = async () => {
    const res = await window.schoolApp.app.openBackupDialog()
    if (!res.success || !res.data || res.data.canceled || !res.data.path) return
    const chosenPath = res.data.path
    const fileName = chosenPath.split(/[/\\]/).pop() ?? chosenPath
    setRestoreTarget({ path: chosenPath, name: fileName })
    setRestoreError(null)
    setRestoreSuccess(false)
    setRestoreConfirmOpen(true)
  }

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return
    setRestoring(true)
    setRestoreError(null)
    try {
      const restoreRes = await window.schoolApp.backups.restore(restoreTarget.path)
      if (restoreRes.success) {
        setRestoreSuccess(true)
        setTimeout(async () => {
          try {
            await logout()
          } catch { /* ignore */ }
          navigate('/login', {
            replace: true,
            state: { successMessage: t('backups.restoreComplete') },
          })
        }, 900)
      } else {
        setRestoreError(restoreRes.error ?? t('common.error'))
      }
    } catch (err: any) {
      setRestoreError(err?.message ?? t('common.error'))
    } finally {
      setRestoring(false)
    }
  }

  const handleSaveAutoLock = async () => {
    const res = await window.schoolApp.settings.setAutoLock(autoLockMinutes)
    if (res.success) {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleAdminPhoto = async () => {
    const usernameForFile = adminForm.username.trim() || String(admin?.username ?? 'admin')
    const res = await window.schoolApp.media.selectImage('admin', usernameForFile)
    if (res.success && res.data?.path) {
      const updateRes = await window.schoolApp.settings.updateAdmin({ photoPath: res.data.path })
      if (updateRes.success) {
        setAdmin((prev) => (prev ? { ...prev, photoPath: res.data!.path } : null))
        const photoRes = await window.schoolApp.media.getImageUrl(res.data.path)
        if (photoRes.success && photoRes.data?.url) setAdminPhotoUrl(photoRes.data.url)
        await refreshSession()
      }
    }
  }

  const handleSaveAdminProfile = async () => {
    const fullName = adminForm.fullName.trim()
    const username = adminForm.username.trim()

    if (!fullName) {
      setAdminError(t('setup.errorAdminFields') || 'يرجى إدخال اسم المسؤول')
      setAdminSaveStatus('error')
      return
    }
    if (!username || username.length < 3) {
      setAdminError('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل')
      setAdminSaveStatus('error')
      return
    }

    setAdminSaving(true)
    setAdminError('')
    setAdminSaveStatus('idle')

    try {
      const res = await window.schoolApp.settings.updateAdmin({
        fullName,
        username,
      })
      if (res.success) {
        setAdmin((prev) =>
          prev ? { ...prev, fullName: res.data.fullName, username: res.data.username } : null
        )
        setAdminForm({ fullName: res.data.fullName, username: res.data.username })
        setAdminSaveStatus('success')
        await refreshSession()
        setTimeout(() => setAdminSaveStatus('idle'), 3500)
      } else {
        setAdminError(res.error || t('settings.adminSaveError'))
        setAdminSaveStatus('error')
      }
    } catch (err: any) {
      setAdminError(err.message || t('settings.adminSaveError'))
      setAdminSaveStatus('error')
    } finally {
      setAdminSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all bg-white'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5'

  const tr = (ar: string, fr: string, en: string) => {
    if (lang === 'ar') return ar
    if (lang === 'fr') return fr
    return en
  }

  const navItems: { key: SettingsSection; label: string; icon: any }[] = [
    { key: 'school', label: t('settings.school'), icon: School },
    { key: 'application', label: t('settings.appearance'), icon: Wrench },
    { key: 'users', label: tr('المستخدمون والأدوار', 'Utilisateurs & Rôles', 'Users & Roles (RBAC)'), icon: Users },
    { key: 'billing', label: tr('سياسات الاشتراكات والدفع', 'Politiques de facturation', 'Billing Policies'), icon: CreditCard },
    { key: 'whatsapp', label: tr('إشعارات واتساب والنماذج', 'Modèles WhatsApp', 'WhatsApp Templates'), icon: MessageCircle },
    { key: 'diagnostics', label: tr('سلامة النظام والتشخيص', 'Diagnostics du système', 'System Diagnostics'), icon: Activity },
    { key: 'printing', label: t('settings.printing'), icon: Printer },
    { key: 'backup', label: t('settings.backup'), icon: Database },
    { key: 'security', label: t('settings.security'), icon: Shield },
    { key: 'about', label: tr('عن النسخة التجارية 2.0', 'À propos d\'Edupilot 2.0', 'About Commercial 2.0'), icon: Info },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
      {/* Left nav */}
      <div className="bg-white rounded-xl border border-border p-3 h-fit">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 text-start ${
              section === key
                ? 'bg-[#EFF6FF] text-[#2563EB]'
                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-5">
        {/* Save status banner */}
        {saveStatus !== 'idle' && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in ${
            saveStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {saveStatus === 'success' ? t('settings.saved') : t('common.error')}
          </div>
        )}

        {/* ── School Profile ── */}
        {section === 'school' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9]">
              {t('settings.school')}
            </h3>

            {/* Logo Upload & Preview Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#2563EB]/20 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt="School Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="font-serif font-black text-xl text-[#2563EB]">EP</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0F172A]">{tr('شعار المؤسسة المعتمد', 'Logo officiel de l\'établissement', 'Official School Logo')}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {tr(
                      'يظهر الشعار في الشريط العلوي، بطاقات التلاميذ، ووصولات الدفع الرسمية.',
                      'Le logo apparaît dans l\'en-tête, les cartes scolaires et les reçus de paiement.',
                      'Appears in header, student ID cards, and thermal receipts.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSelectSchoolLogo}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#2563EB] border border-slate-200 rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                {tr('اختيار وتغيير الشعار', 'Changer le logo', 'Change Logo')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('settings.schoolNameAr')}</label>
                <input className={inputCls} value={settings.schoolNameAr ?? ''} onChange={set('schoolNameAr')} dir="rtl" />
              </div>
              <div>
                <label className={labelCls}>{t('settings.schoolNameFr')}</label>
                <input className={inputCls} value={settings.schoolNameFr ?? ''} onChange={set('schoolNameFr')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('settings.schoolNameEn')}</label>
                <input className={inputCls} value={settings.schoolNameEn ?? ''} onChange={set('schoolNameEn')} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>{tr('الوصف الفرعي (العنوان في الشريط العلوي)', 'Sous-titre dans l\'en-tête', 'Header Subtitle')}</label>
                <input
                  className={inputCls}
                  value={settings.headerSubtitle ?? ''}
                  onChange={set('headerSubtitle')}
                  placeholder={tr('مؤسسة التعليم والدعم المدرسي', 'Établissement d\'enseignement & soutien', 'School & Academy')}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{tr('نوع المؤسسة والنشاط التعليمي', 'Type d\'établissement & activité', 'School Type & Profile')}</label>
              <select
                className={inputCls}
                value={settings.schoolType ?? 'Language School'}
                onChange={set('schoolType')}
              >
                <option value="Language School">{tr('مدرسة لغات ومركز لغات أجنبية', 'École de langues', 'Language School')}</option>
                <option value="Tutoring Center">{tr('مركز دروس الدعم والتقوية المدرسية', 'Centre de soutien scolaire', 'Tutoring Center')}</option>
                <option value="Private School">{tr('مدرسة خاصة (ابتدائي / متوسط / ثانوي)', 'École privée (Primaire / CEM / Lycée)', 'Private K-12 School')}</option>
                <option value="Quranic School">{tr('مدرسة قرآنية وزاوية تعليمية', 'École coranique', 'Quranic School')}</option>
                <option value="Vocational Academy">{tr('معهد تكوين مهني وتدريب معتمد', 'Institut de formation professionnelle', 'Vocational Training Academy')}</option>
                <option value="Music & Arts Academy">{tr('أكاديمية فنون وموسيقى', 'Académie des arts et musique', 'Music & Arts Academy')}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('settings.phone')}</label>
                <input className={inputCls} value={settings.phone ?? ''} onChange={set('phone')} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>{t('settings.email')}</label>
                <input type="email" className={inputCls} value={settings.email ?? ''} onChange={set('email')} dir="ltr" />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('settings.address')}</label>
              <input className={inputCls} value={settings.address ?? ''} onChange={set('address')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('settings.academicYear')}</label>
                <input className={inputCls} value={settings.academicYear ?? ''} onChange={set('academicYear')} placeholder="2025-2026" dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>{t('settings.currency')}</label>
                <input className={inputCls} value={settings.currency ?? ''} onChange={set('currency')} placeholder="DZD" dir="ltr" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        )}

        {/* ── Users & Roles (RBAC) ── */}
        {section === 'users' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="font-semibold text-[#0F172A] text-sm">
                  {tr('إدارة المستخدمين وصلاحيات الوصول (RBAC)', 'Gestion des utilisateurs & droits d\'accès (RBAC)', 'User Management & Access Control')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tr(
                    'إضافة وتعديل حسابات الطاقم الإداري والأساتذة وتحديد الصلاحيات بدقة',
                    'Gérer les comptes administrateurs, secrétaires et enseignants',
                    'Manage administrator, secretary, accountant and teacher accounts'
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setNewUsername('')
                  setNewFullName('')
                  setNewPassword('')
                  setNewRole('admin')
                  setNewLang('ar')
                  setUserModalError('')
                  setShowAddUserModal(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Plus size={13} /> {tr('إضافة مستخدم جديد', 'Ajouter un utilisateur', 'Add User')}
              </button>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : usersList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">{tr('لا يوجد مستخدمون مسجلون', 'Aucun utilisateur enregistré', 'No users registered')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-start font-semibold">{tr('المستخدم', 'Nom d\'utilisateur', 'User')}</th>
                      <th className="py-2.5 px-3 text-start font-semibold">{tr('الاسم الكامل', 'Nom complet', 'Full Name')}</th>
                      <th className="py-2.5 px-3 text-start font-semibold">{tr('الدور / الصلاحية', 'Rôle / Droits', 'Role')}</th>
                      <th className="py-2.5 px-3 text-start font-semibold">{tr('اللغة', 'Langue', 'Language')}</th>
                      <th className="py-2.5 px-3 text-start font-semibold">{tr('الحالة', 'Statut', 'Status')}</th>
                      <th className="py-2.5 px-3 text-start font-semibold">{tr('آخر دخول', 'Dernière connexion', 'Last Login')}</th>
                      <th className="py-2.5 px-3 text-end font-semibold">{tr('الإجراءات', 'Actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">{u.username}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{u.fullName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'admin' || u.role === 'superadmin' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'accountant' ? 'bg-emerald-100 text-emerald-800' :
                            u.role === 'secretary' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 uppercase text-slate-500 font-mono text-[10px]">{u.preferredLanguage}</td>
                        <td className="py-2.5 px-3">
                          {u.isActive ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={11} /> {tr('نشط', 'Actif', 'Active')}
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold flex items-center gap-1">
                              <AlertCircle size={11} /> {tr('معطل', 'Désactivé', 'Disabled')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingUser(u)
                                setEditRole(u.role)
                                setEditIsActive(u.isActive)
                                setEditPassword('')
                              }}
                              className="p-1 text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title={tr('تعديل الصلاحية / كلمة المرور', 'Modifier le rôle / mot de passe', 'Edit')}
                            >
                              <Edit2 size={13} />
                            </button>
                            {u.role !== 'owner' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title={tr('حذف', 'Supprimer', 'Delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Billing Policies ── */}
        {section === 'billing' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div className="pb-3 border-b border-[#F1F5F9]">
              <h3 className="font-semibold text-[#0F172A] text-sm">
                {tr('سياسات الاشتراكات ونماذج التسعير التجارية', 'Politiques d\'abonnement & modèles tarifaires', 'Commercial Billing Policies & Pricing Models')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tr('تحديد النمط الافتراضي لتسعير الأفواج وباقات الحصص', 'Définir la tarification par défaut des groupes et forfaits', 'Configure default pricing structure and session packages')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-xs text-[#0F172A] mb-2 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-[#2563EB]" />
                  {tr('النموذج المالي الافتراضي للأفواج الجديدة', 'Modèle financier par défaut des nouveaux groupes', 'Default Course Billing Model')}
                </h4>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  {tr(
                    'يمكنك تحديد النظام الافتراضي المطبق عند إنشاء دورات وأفواج جديدة، مع إمكانية تخصيص كل فوج على حدة.',
                    'Sélectionnez le modèle financier par défaut appliqué aux nouveaux cours créés.',
                    'Select the default billing model for newly created groups.'
                  )}
                </p>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300">
                    <input type="radio" name="billingDef" defaultChecked className="text-[#2563EB]" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {lang === 'ar' ? (
                          <>اشتراك شهري تقليدي <bdi dir="ltr">(MONTHLY)</bdi></>
                        ) : lang === 'fr' ? (
                          'Abonnement mensuel (MONTHLY)'
                        ) : (
                          'Monthly Subscription (MONTHLY)'
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tr('حساب الاستحقاق شهرياً بقيمة ثابتة', 'Facturation mensuelle à montant fixe', 'Fixed monthly tuition')}
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300">
                    <input type="radio" name="billingDef" className="text-[#2563EB]" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {lang === 'ar' ? (
                          <>دفع بالحصة عند الحضور <bdi dir="ltr">(PER_SESSION)</bdi></>
                        ) : lang === 'fr' ? (
                          'Paiement par séance (PER_SESSION)'
                        ) : (
                          'Pay Per Session (PER_SESSION)'
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tr('تخصم فقط الحصص التي حضرها التلميذ', 'Déduit uniquement lors de la présence de l\'élève', 'Deducted only upon attendance')}
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300">
                    <input type="radio" name="billingDef" className="text-[#2563EB]" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {lang === 'ar' ? (
                          <>باقات حصص مسبقة الدفع <bdi dir="ltr">(SESSION_PACKAGE)</bdi></>
                        ) : lang === 'fr' ? (
                          'Forfaits de séances prépayés (SESSION_PACKAGE)'
                        ) : (
                          'Prepaid Session Packages (SESSION_PACKAGE)'
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tr('باقة من 4 أو 8 أو 12 حصة مع تنبيه انتهاء الرصيد', 'Pack de 4, 8 ou 12 séances avec alertes d\'épuisement', '4, 8, 12 sessions pack with depletion alerts')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-[#0F172A] mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-600" />
                  {tr('ضوابط الباقات والديون', 'Règles des forfaits & dettes', 'Package & Debt Rules')}
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr('عدد الحصص الافتراضي للباقة', 'Nombre de séances par défaut pour le forfait', 'Default Sessions per Package')}
                  </label>
                  <input
                    type="number"
                    defaultValue={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr('فترة السماح بالديون (عدد الحصص قبل المنع)', 'Délai de grâce pour dettes (séances autorisées)', 'Debt Grace Period (Sessions)')}
                  </label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                  />
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px]">
                  ✓ {tr(
                    'حساب الديون يعمل بتكامل فوري مع قارئ الباركود/QR عند الباب',
                    'La vérification des dettes est intégrée en direct au scanner QR d\'accès',
                    'Debt verification is checked instantly at the QR gate scanner'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WhatsApp Communication ── */}
        {section === 'whatsapp' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="font-semibold text-[#0F172A] text-sm flex items-center gap-2">
                  <MessageCircle size={16} className="text-emerald-600" />
                  {tr('إدارة نماذج رسائل واتساب', 'Modèles de notifications WhatsApp', 'WhatsApp Notification Templates')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tr('تخصيص نصوص الرسائل المعتمدة للغياب، وصولات الدفع، وإشعارات الديون', 'Personnalisez les messages pour les absences, reçus et rappels de paiements', 'Customize automated message text for absences, receipts, and debt alerts')}
                </p>
              </div>
              <button
                onClick={loadTemplates}
                disabled={templatesLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} className={templatesLoading ? 'animate-spin' : ''} />
                <span>{t('common.refresh') || tr('تحديث', 'Actualiser', 'Refresh')}</span>
              </button>
            </div>

            {templatesLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">{tr('لا توجد نماذج مسجلة', 'Aucun modèle trouvé', 'No templates found')}</p>
            ) : (
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2 hover:border-emerald-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0F172A]">
                          {lang === 'ar' ? tpl.nameAr : lang === 'fr' ? (tpl.nameFr || tpl.nameEn || tpl.nameAr) : (tpl.nameEn || tpl.nameAr)}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          {tpl.templateKey}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tpl.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {tpl.isActive ? tr('مفعل', 'Actif', 'Active') : tr('معطل', 'Désactivé', 'Disabled')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl)
                          setTplBodyAr(tpl.bodyAr)
                          setTplBodyFr(tpl.bodyFr)
                          setTplBodyEn(tpl.bodyEn)
                          setTplIsActive(tpl.isActive)
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} /> {tr('تعديل النص', 'Modifier le texte', 'Edit Text')}
                      </button>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                      {lang === 'fr' && tpl.bodyFr ? tpl.bodyFr : lang === 'en' && tpl.bodyEn ? tpl.bodyEn : tpl.bodyAr}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{tr('المتغيرات المدعومة:', 'Variables supportées :', 'Variables:')}</span>
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{'{{studentName}}'}</span>
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{'{{balance}}'}</span>
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{'{{schoolName}}'}</span>
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{'{{amount}}'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── System Diagnostics & Health ── */}
        {section === 'diagnostics' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="font-semibold text-[#0F172A] text-sm flex items-center gap-2">
                  <Activity size={16} className="text-[#2563EB]" />
                  {tr('سلامة النظام والتشخيص الفني', 'Diagnostics du système & santé technique', 'System Diagnostics & Technical Health')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tr('فحص نزاهة قاعدة البيانات SQLite، المساحة التخزينية، وحزم الدعم الفني', 'Vérification de l\'intégrité SQLite, de l\'espace disque et exportation des paquets d\'assistance', 'Check SQLite PRAGMA integrity, disk space, and export sanitized diagnostic bundles')}
                </p>
              </div>
              <button
                onClick={runDiagnostics}
                disabled={diagLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw size={12} className={diagLoading ? 'animate-spin' : ''} />
                <span>{tr('إعادة الفحص الآن', 'Relancer le test', 'Run Check')}</span>
              </button>
            </div>

            {diagLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : diagReport ? (
              <div className="space-y-4 text-xs">
                {/* Overall Status Banner */}
                {(() => {
                  const isAllOk = diagReport.checks.every((c) => c.status === 'ok')
                  return (
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      isAllOk
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className={isAllOk ? 'text-emerald-600' : 'text-amber-600'} />
                        <div>
                          <p className="font-bold text-sm">
                            {isAllOk ? tr('النظام في حالة ممتازة وسليمة 100%', 'Tous les systèmes sont opérationnels (100% OK)', 'All Systems Operational') : tr('تم رصد تنبيهات بالنظام', 'Avertissements / Problèmes détectés', 'Issues / Warnings Detected')}
                          </p>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            {tr(`فحص النزاهة لـ SQLite: ${diagReport.sqliteIntegrity}`, `Intégrité SQLite : ${diagReport.sqliteIntegrity}`, `SQLite Integrity: ${diagReport.sqliteIntegrity}`)}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[11px] bg-white/70 px-2.5 py-1 rounded-md border border-black/10">
                        v{diagReport.appVersion}
                      </span>
                    </div>
                  )
                })()}

                {/* Diagnostic Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diagReport.checks.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{item.detail}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        item.status === 'ok' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Database & Storage Stats */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive size={14} className="text-[#2563EB]" />
                    {tr('المسارات التخزينية المخصصة لـ Edupilot 2.0', 'Emplacements de stockage EduPilot 2.0', 'Dedicated Storage Paths')}
                  </h4>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">{tr('سلامة قاعدة البيانات:', 'Intégrité de la base :', 'Database Integrity:')}</span>
                      <span className="font-bold text-slate-800">{diagReport.sqliteIntegrity}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">{tr('إصدار المخطط:', 'Version du schéma :', 'Schema Version:')}</span>
                      <span className="font-bold text-slate-800">v{diagReport.schemaVersion}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400">{tr('مساحة القرص الحرة:', 'Espace disque libre :', 'Free Disk Space:')}</span>
                      <span className="font-bold text-slate-800">{diagReport.freeDiskSpaceGb} GB</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">{tr('دليل التطبيق (AppData):', 'Répertoire AppData :', 'AppData Directory:')}</span>
                      <span className="text-[#0F172A] truncate max-w-xs">{diagReport.userDataPath}</span>
                    </div>
                  </div>
                </div>

                {/* Export Support Package Card */}
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                        <Download size={14} className="text-[#2563EB]" />
                        {tr('تصدير حزمة الدعم الفني المنقحة', 'Exporter le pack d\'assistance technique', 'Export Technical Support Package')}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {tr(
                          'يقوم هذا الخيار بتجميع تقرير فحص النظام، وسجلات الأخطاء، وإحصائيات الجداول في ملف ZIP واحد. يتم حجب وتشفير أي بيانات شخصية أو أرقام هواتف لضمان الخصوصية التامة.',
                          'Exporte une archive ZIP contenant les journaux techniques et diagnostics, sans aucune donnée personnelle d\'élève.',
                          'Exports a sanitized ZIP containing technical logs and schema diagnostics with zero sensitive student data.'
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleExportSupport}
                      disabled={exportingSupport}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Download size={13} />
                      {exportingSupport ? tr('جارٍ التصدير...', 'Exportation...', 'Exporting...') : tr('تصدير ملف ZIP', 'Exporter en ZIP', 'Export ZIP')}
                    </button>
                  </div>

                  {supportZipPath && (
                    <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-lg font-mono text-[11px]">
                      ✓ {tr('تم إنشاء ملف الدعم بنجاح في المسار: ', 'Paquet généré avec succès à l\'emplacement : ', 'Package generated at: ')} {supportZipPath}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── About Commercial 2.0 ── */}
        {section === 'about' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-5 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs flex items-center justify-center overflow-hidden">
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="font-serif font-black text-2xl text-[#2563EB]">EP</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[#0F172A] tracking-tight">EduPilot 2.0 Commercial</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#2563EB] border border-blue-200 uppercase">
                    v2.0.0
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5 text-xs">
                  {tr('المنظومة الاحترافية لإدارة المدارس الخاصة ومراكز الدروس الخصوصية', 'Système professionnel de gestion d\'écoles privées et centres de cours', 'Comprehensive School Management System')}
                </p>
              </div>
            </div>

            {/* Technical Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">{tr('البيئة والمنصة', 'Environnement & Plateforme', 'Environment & Runtime')}</span>
                <p className="text-slate-500 font-mono text-[11px]">Electron 32 · React 19 · Node 20</p>
                <p className="text-slate-500 font-mono text-[11px]">Windows x64 Native Desktop Application</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">{tr('عزل البيانات والاستقلالية', 'Isolation des données & Sécurité', 'Data Isolation & Safety')}</span>
                <p className="text-slate-500 font-mono text-[11px]">%APPDATA%/Edupilot-2-Commercial</p>
                <p className="text-slate-500 font-mono text-[11px]">Database: edupilot-v2.sqlite (Zero 1.0 collision)</p>
              </div>
            </div>

            {/* Offline Guarantee */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-700" />
                {tr('ضمان العمل الكامل دون إنترنت (100% محلي ومستقل)', 'Fonctionnement 100% Hors-ligne Garanti', '100% Offline Standalone Assurance')}
              </h4>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                {tr(
                  'تعمل هذه المنظومة بشكل كامل ومستقل دون الحاجة لأي اتصال بالإنترنت أو خوادم سحابية. جميع بيانات التلاميذ، الأولياء، المدفوعات، والوثائق مخزنة ومشفرة محلياً على جهاز المؤسسة فقط.',
                  'Cette application fonctionne entièrement en mode hors-ligne sans connexion internet ni serveurs distants. Toutes les données sont chiffrées et sécurisées localement.',
                  'This application is fully standalone and operates entirely offline. No student or financial data is ever sent to external cloud servers.'
                )}
              </p>
            </div>

            {/* Licensing */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{tr('الترخيص التجاري للمنتج', 'Licence commerciale du produit', 'Commercial Product License')}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{tr('نسخة تجارية مخصصة للمؤسسة', 'Édition dédiée pour établissement unique', 'Commercial Single-School Dedicated Edition')}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                {tr('مرخص ومفعل', 'Licence vérifiée & active', 'Licensed & Verified')}
              </span>
            </div>
          </div>
        )}

        {/* ── Application ── */}
        {section === 'application' && (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9]">
              {t('settings.appearance')}
            </h3>
            <div>
              <label className={labelCls}>{t('settings.language')}</label>
              <select className={inputCls} value={settings.defaultLanguage ?? 'ar'} onChange={set('defaultLanguage')}>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('settings.studentPrefix')}</label>
                <input className={inputCls} value={(settings as any).studentNumberPrefix ?? 'ETU'} placeholder="ETU" dir="ltr"
                  onChange={(e) => setSettings(s => ({ ...s, studentNumberPrefix: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>{t('settings.receiptPrefix')}</label>
                <input className={inputCls} value={(settings as any).receiptPrefix ?? 'REC'} placeholder="REC" dir="ltr"
                  onChange={(e) => setSettings(s => ({ ...s, receiptPrefix: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        )}

        {/* ── Printing & Thermal Receipts ── */}
        {section === 'printing' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="font-semibold text-[#0F172A] text-sm">
                    {t('settings.printingTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('settings.printingSubtitle')}
                  </p>
                </div>
                <button
                  onClick={loadPrinters}
                  disabled={printersLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-[#2563EB] bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
                >
                  <RotateCcw size={12} className={printersLoading ? 'animate-spin' : ''} />
                  <span>{t('settings.refreshPrinters')}</span>
                </button>
              </div>

              {/* Missing printer warning */}
              {settings.receiptPrinterName &&
                !printersLoading &&
                printers.length > 0 &&
                !printers.some((p) => p.name.toLowerCase() === settings.receiptPrinterName?.toLowerCase()) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                    <span>{t('settings.printerNotFoundWarning', { name: settings.receiptPrinterName })}</span>
                  </div>
                )}

              {/* Printer Selection Dropdown */}
              <div>
                <label className={labelCls}>{t('settings.selectPrinter')}</label>
                <select
                  className={inputCls}
                  value={settings.receiptPrinterName ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, receiptPrinterName: e.target.value || null }))}
                >
                  <option value="">-- {t('settings.selectPrinter')} --</option>
                  {printers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.displayName || p.name} {p.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
                {printers.length === 0 && !printersLoading && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t('settings.noPrintersFound')}
                  </p>
                )}
                {settings.receiptPrinterName && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Device Name: <span className="font-semibold text-slate-700">{settings.receiptPrinterName}</span>
                  </p>
                )}
              </div>

              {/* Paper Width */}
              <div>
                <label className={labelCls}>{t('settings.paperWidth')}</label>
                <select
                  className={inputCls}
                  value={settings.receiptPaperWidth ?? '80mm'}
                  onChange={(e) => setSettings((s) => ({ ...s, receiptPaperWidth: e.target.value }))}
                >
                  <option value="80mm">{t('settings.paperWidth80')}</option>
                  <option value="58mm">{t('settings.paperWidth58')}</option>
                </select>
              </div>

              {/* Show Print Dialog Toggle */}
              <div className="pt-2 border-t border-[#F1F5F9] space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    checked={settings.showPrintDialog !== false}
                    onChange={(e) => setSettings((s) => ({ ...s, showPrintDialog: e.target.checked }))}
                  />
                  <div>
                    <span className="text-sm font-medium text-[#0F172A] block">
                      {t('settings.showPrintDialog')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t('settings.showPrintDialogDesc')}
                    </span>
                  </div>
                </label>

                {/* Auto Print After Payment Toggle */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                    checked={Boolean(settings.autoPrintReceipt)}
                    onChange={(e) => setSettings((s) => ({ ...s, autoPrintReceipt: e.target.checked }))}
                  />
                  <div>
                    <span className="text-sm font-medium text-[#0F172A] block">
                      {t('settings.autoPrintReceipt')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t('settings.autoPrintReceiptDesc')}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                >
                  {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>

            {/* Diagnostic Test Print Card */}
            <div className="bg-white rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
                <Printer size={16} className="text-[#2563EB]" />
                {t('settings.testPrintTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('settings.testPrintDesc')}
              </p>

              {testPrintStatus === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{t('settings.testPrintSuccess')}</span>
                </div>
              )}

              {testPrintStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{testPrintError || t('settings.testPrintFailed')}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleTestPrint}
                  disabled={testPrintStatus === 'loading' || !settings.receiptPrinterName}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {testPrintStatus === 'loading' ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Printer size={14} />
                  )}
                  {t('settings.testPrintBtn')}
                </button>
                {!settings.receiptPrinterName && (
                  <span className="text-xs text-slate-400">
                    {t('settings.receiptPrinterNotConfigured')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Backup ── */}
        {section === 'backup' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9]">
                {t('settings.backup')}
              </h3>
              <div>
                <label className={labelCls}>{t('settings.backupDir')}</label>
                <div className="flex gap-2">
                  <input className={`${inputCls} flex-1`} value={settings.backupDirectory ?? ''} readOnly dir="ltr"
                    placeholder={t('backups.chooseDir')} />
                  <button onClick={handleChooseBackupDir} className="px-3 py-2 border border-border rounded-lg text-sm text-slate-600 hover:bg-slate-50 shrink-0 flex items-center gap-1.5">
                    <FolderOpen size={14} /> {t('backups.chooseDir')}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="autoBackup" checked={settings.automaticBackupEnabled ?? false}
                  onChange={setChecked('automaticBackupEnabled')} className="w-4 h-4 text-[#2563EB] rounded" />
                <label htmlFor="autoBackup" className="text-sm font-medium text-[#0F172A]">
                  {t('settings.autoBackup')}
                </label>
              </div>
              {settings.automaticBackupEnabled && (
                <div>
                  <label className={labelCls}>{t('settings.backupsToRetain')}</label>
                  <input type="number" className={inputCls} value={settings.backupsToRetain ?? 30} min={1} max={365} dir="ltr"
                    onChange={(e) => setSettings(s => ({ ...s, backupsToRetain: Number(e.target.value) }))} />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors">
                  {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                <button onClick={handleCreateBackup} disabled={creating}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors">
                  {creating ? <span className="w-4 h-4 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" /> : <Plus size={14} />}
                  {creating ? t('backups.creating') : t('backups.create')}
                </button>
                <button onClick={handleRestoreBackup} disabled={restoring}
                  className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 disabled:opacity-60 transition-colors">
                  <RotateCcw size={14} /> {restoring ? t('backups.restoring') : t('backups.restore')}
                </button>
              </div>
              {backupStatus && (
                <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{backupStatus}</p>
              )}
            </div>

            {/* Backup list */}
            {backups.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9] mb-4">
                  {t('backups.list')}
                </h3>
                <div className="space-y-2">
                  {backups.map((b, i) => {
                    const fileName = b.filename ?? b.path?.split(/[/\\]/).pop() ?? 'backup.zip'
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                        <div>
                          <p className="text-sm font-medium text-[#0F172A]">{fileName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{b.createdAt ?? b.created_at}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            {b.sizeBytes ? `${(b.sizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setRestoreTarget({ path: b.path, name: fileName })
                              setRestoreError(null)
                              setRestoreSuccess(false)
                              setRestoreConfirmOpen(true)
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                          >
                            <RotateCcw size={12} />
                            {t('backups.restore')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Security ── */}
        {section === 'security' && (
          <div className="space-y-5">
            {/* Admin profile */}
            {admin && (
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-5">
                  <h3 className="font-semibold text-[#0F172A] text-sm flex items-center gap-2">
                    <User size={15} className="text-[#2563EB]" /> {t('settings.adminProfile')}
                  </h3>
                  {adminSaveStatus === 'success' && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={13} /> {t('settings.adminProfileSaved')}
                    </span>
                  )}
                </div>

                {adminError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-lg text-xs font-medium mb-4">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-5">
                  {/* Photo with hover badge */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div
                      className="relative group cursor-pointer"
                      onClick={handleAdminPhoto}
                      title={t('settings.clickToChangePhoto')}
                    >
                      {adminPhotoUrl ? (
                        <img
                          src={adminPhotoUrl}
                          alt={adminForm.fullName || admin.fullName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#2563EB]/30 shadow-sm group-hover:border-[#2563EB] transition-colors"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                          {(adminForm.fullName || admin.fullName || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                        <Camera size={18} />
                        <span className="text-[10px] font-medium">{t('settings.changePhoto')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdminPhoto}
                      className="text-xs text-[#2563EB] hover:text-blue-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Camera size={12} />
                      {t('settings.changePhoto')}
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        {t('settings.adminFullName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminForm.fullName}
                        onChange={(e) => setAdminForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Benammer"
                        className={inputCls}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {tr('الاسم الكامل الذي يظهر في النظام والشريط الجانبي', 'Nom complet affiché dans le système et la barre latérale', 'Full name displayed in the system and sidebar')}
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>
                        {t('settings.adminUsername')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminForm.username}
                        onChange={(e) => setAdminForm((prev) => ({ ...prev, username: e.target.value }))}
                        placeholder="khemici"
                        className={inputCls}
                        dir="ltr"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {tr('اسم المستخدم المستخدم لتسجيل الدخول', 'Identifiant utilisé pour la connexion', 'Username used to log in')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAdminProfile}
                    disabled={adminSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <Save size={14} />
                    {adminSaving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </div>
            )}

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9] mb-4 flex items-center gap-2">
                <KeyRound size={14} /> {t('auth.changePassword')}
              </h3>
              {pwStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm mb-3">
                  <CheckCircle2 size={15} /> {t('auth.passwordChanged')}
                </div>
              )}
              {pwError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm mb-3">
                  <AlertCircle size={15} /> {pwError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>{t('auth.currentPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={inputCls}
                      value={pwForm.current}
                      onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                      dir="ltr"
                    />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('auth.newPassword')}</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={inputCls}
                    value={pwForm.next}
                    onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('auth.confirmPassword')}</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={inputCls}
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  <KeyRound size={14} /> {t('auth.changePassword')}
                </button>
              </div>
            </div>

            {/* Auto-lock */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-[#0F172A] text-sm pb-2 border-b border-[#F1F5F9] mb-4 flex items-center gap-2">
                <Clock size={14} /> {t('settings.autoLock')}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {t('settings.autoLockDesc')}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className={`${inputCls} w-28`}
                  value={autoLockMinutes}
                  min={0}
                  max={120}
                  dir="ltr"
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                />
                <span className="text-sm text-slate-600">{tr('دقيقة', 'minutes', 'minutes')}</span>
                <button onClick={handleSaveAutoLock} className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
                  <Save size={14} /> {t('common.save')}
                </button>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] mb-4">
                <h3 className="font-semibold text-[#0F172A] text-sm flex items-center gap-2">
                  <Clock size={14} /> {t('settings.auditLog')}
                </h3>
                <button onClick={loadAuditLogs} className="text-xs text-[#2563EB] hover:underline">{t('common.refresh')}</button>
              </div>
              {logsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">{t('settings.noAuditLogs')}</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-[#F1F5F9] last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0F172A]">
                          <span className="font-medium">{log.adminName}</span>{' '}
                          <span className="text-slate-500">{log.action}</span>
                          {log.entityType && <span className="text-slate-400 text-xs"> · {log.entityType} #{log.entityId}</span>}
                        </p>
                        <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Restore Backup Confirmation Modal */}
      {restoreConfirmOpen && restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-amber-50/70">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {t('backups.confirmRestore')}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5" dir="ltr">
                  {restoreTarget.name}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {restoreSuccess ? (
                <div className="flex flex-col items-center justify-center py-5 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check size={24} />
                  </div>
                  <p className="font-semibold text-emerald-800 text-sm">
                    {t('backups.restoreSuccess')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed">
                    <p className="font-medium mb-1.5 flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle size={15} className="shrink-0" />
                      {t('common.warning')}
                    </p>
                    <p className="text-xs text-amber-900/90 leading-normal">
                      {t('backups.confirmRestoreMsg')}
                    </p>
                  </div>

                  <p className="text-sm text-[#0F172A] font-medium">
                    {t('backups.confirmRestorePrompt')}
                  </p>

                  {restoreError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                      {restoreError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!restoreSuccess && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!restoring) {
                      setRestoreConfirmOpen(false)
                      setRestoreTarget(null)
                    }
                  }}
                  disabled={restoring}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={restoring}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition-colors disabled:opacity-60"
                >
                  {restoring ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>{t('backups.restoring')}</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>{t('common.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Add New User (RBAC) ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddUserModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
                <Users size={18} className="text-[#2563EB]" />
                {tr('إضافة مستخدم جديد للنظام', 'Ajouter un nouvel utilisateur', 'Add New User')}
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {userModalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {userModalError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('اسم المستخدم للدخول *', 'Nom d\'utilisateur *', 'Username *')}
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. amine_admin"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('الاسم واللقب الكامل *', 'Nom et prénom complets *', 'Full Name *')}
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder={tr('مثال: أمين منصوري', 'ex. Amine Mansouri', 'e.g. Amine Mansouri')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('كلمة المرور الأولية *', 'Mot de passe initial *', 'Initial Password *')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {tr('الدور / الصلاحية *', 'Rôle / Permissions *', 'Role *')}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="admin">{tr('مدير نظام', 'Administrateur système (Admin)', 'System Administrator (Admin)')}</option>
                    <option value="secretary">{tr('سكرتارية واستقبال', 'Secrétaire (Accueil & inscriptions)', 'Secretary (Reception & front desk)')}</option>
                    <option value="accountant">{tr('محاسب / مالية', 'Comptable (Gestion financière & caisse)', 'Accountant (Financial manager)')}</option>
                    <option value="teacher">{tr('أستاذ', 'Enseignant (Professeur)', 'Teacher')}</option>
                    <option value="viewer">{tr('مُطّلع (اطلاع فقط)', 'Lecteur (Consultation seule)', 'Viewer (Read-only)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {tr('اللغة المفضلة', 'Langue préférée', 'Language')}
                  </label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value as Language)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                  >
                    <option value="ar">العربية (Ar)</option>
                    <option value="fr">Français (Fr)</option>
                    <option value="en">English (En)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveNewUser}
                disabled={savingUser}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {savingUser ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit User ── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
                <Edit2 size={16} className="text-[#2563EB]" />
                {tr('تعديل بيانات المستخدم:', 'Modifier l\'utilisateur :', 'Edit User:')} <span className="font-mono text-sm text-[#2563EB]">{editingUser.username}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('الدور والصلاحيات', 'Rôle & Permissions', 'Role & Permissions')}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
                >
                  <option value="admin">{tr('مدير نظام', 'Administrateur système (Admin)', 'System Administrator (Admin)')}</option>
                  <option value="secretary">{tr('سكرتارية واستقبال', 'Secrétaire (Accueil & inscriptions)', 'Secretary (Reception & front desk)')}</option>
                  <option value="accountant">{tr('محاسب / مالية', 'Comptable (Gestion financière & caisse)', 'Accountant (Financial manager)')}</option>
                  <option value="teacher">{tr('أستاذ', 'Enseignant (Professeur)', 'Teacher')}</option>
                  <option value="viewer">{tr('مُطّلع (اطلاع فقط)', 'Lecteur (Consultation seule)', 'Viewer (Read-only)')}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('إعادة تعيين كلمة المرور (اترك فارغاً للإبقاء على الحالية)', 'Changer le mot de passe (laisser vide pour conserver l\'actuel)', 'Reset Password (leave empty to keep current)')}
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder={tr('كلمة مرور جديدة...', 'Nouveau mot de passe...', 'New password...')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-0"
                />
                <span className="text-slate-700 font-semibold">
                  {tr('الحساب مفعّل ويمكنه تسجيل الدخول', 'Compte actif et autorisé à se connecter', 'Account active and allowed to log in')}
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={savingUser}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {savingUser ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit WhatsApp Template ── */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditingTemplate(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-600" />
                {tr('تعديل نموذج واتساب:', 'Modifier le modèle WhatsApp :', 'Edit WhatsApp Template:')} <span className="font-mono text-sm text-emerald-700">{editingTemplate.templateKey}</span>
              </h3>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('نص الرسالة بالعربية', 'Message en arabe', 'Arabic Message Body')}
                </label>
                <textarea
                  rows={3}
                  value={tplBodyAr}
                  onChange={(e) => setTplBodyAr(e.target.value)}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('نص الرسالة بالفرنسية', 'Message en français', 'French Message Body')}
                </label>
                <textarea
                  rows={3}
                  value={tplBodyFr}
                  onChange={(e) => setTplBodyFr(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tr('نص الرسالة بالإنجليزية', 'Message en anglais', 'English Message Body')}
                </label>
                <textarea
                  rows={2}
                  value={tplBodyEn}
                  onChange={(e) => setTplBodyEn(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 font-sans leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={tplIsActive}
                  onChange={(e) => setTplIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span className="text-slate-700 font-semibold">
                  {tr('تفعيل هذا النموذج في النظام', 'Activer ce modèle dans le système', 'Enable this template')}
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTpl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {savingTpl ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
