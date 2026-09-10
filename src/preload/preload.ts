import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants/index'
import type {
  ApiResult, AuthSession, Student, Teacher, Course, Group,
  Enrollment, AttendanceSession, AttendanceRecord, Payment,
  SchoolSettings, BackupInfo, QRScanResult, PaginatedResult,
  StudentNote, PrinterInfo, ReceiptPrintData,
  Guardian, StudentGuardianLink, FamilySummary, StudentCardInfo,
  StudentDocument, DocumentType, WhatsAppTemplate, TimelineEvent,
  GlobalSearchResult, DiagnosticsReport, AdminRole, Language
} from '../shared/types/index'

// ─── Safe invoke helper — wraps every call ───────────────────────────────────
async function invoke<T>(channel: string, payload?: unknown): Promise<ApiResult<T>> {
  return ipcRenderer.invoke(channel, payload)
}

// ─── The narrow, typed API exposed to the renderer ──────────────────────────
const api = {
  health: {
    check: () =>
      invoke<{
        preloadLoaded: boolean
        mainReachable: boolean
        ipcWorking: boolean
        sqliteOpen: boolean
        migrationsApplied: boolean
      }>(IPC_CHANNELS.HEALTH_CHECK),
  },

  auth: {
    login: (username: string, password: string) =>
      invoke<AuthSession>(IPC_CHANNELS.AUTH_LOGIN, { username, password }),
    logout: () => invoke<boolean>(IPC_CHANNELS.AUTH_LOGOUT),
    changePassword: (currentPassword: string, newPassword: string) =>
      invoke<boolean>(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, { currentPassword, newPassword }),
    getSession: () => invoke<AuthSession | null>(IPC_CHANNELS.AUTH_GET_SESSION),
    checkFirstRun: () => invoke<{ firstRun: boolean }>(IPC_CHANNELS.AUTH_CHECK_FIRST_RUN),
    completeSetup: (data: {
      schoolNameAr: string; schoolNameFr?: string; schoolNameEn?: string
      phone?: string; email?: string; address?: string; academicYear: string
      adminFullName: string; adminUsername: string; adminPassword: string
      preferredLanguage: 'ar' | 'fr' | 'en'
      logoPath?: string | null; schoolType?: string
    }) => invoke<AuthSession>(IPC_CHANNELS.AUTH_COMPLETE_SETUP, data),
  },

  setup: {
    getStatus: () => invoke<{ firstRun: boolean }>(IPC_CHANNELS.AUTH_CHECK_FIRST_RUN),
    complete: (data: {
      schoolNameAr: string; schoolNameFr?: string; schoolNameEn?: string
      phone?: string; email?: string; address?: string; academicYear: string
      adminFullName: string; adminUsername: string; adminPassword: string
      preferredLanguage: 'ar' | 'fr' | 'en'
      logoPath?: string | null; schoolType?: string
    }) => invoke<AuthSession>(IPC_CHANNELS.AUTH_COMPLETE_SETUP, data),
  },

  users: {
    list: () => invoke<Array<{
      id: number; username: string; fullName: string; role: AdminRole
      preferredLanguage: Language; isActive: boolean; lastLoginAt: string | null
      failedLoginAttempts: number; lockedUntil: string | null; createdAt: string; updatedAt: string
    }>>(IPC_CHANNELS.AUTH_LIST_USERS),
    create: (data: { username: string; fullName: string; role: AdminRole; password: string; preferredLanguage?: Language }) =>
      invoke<any>(IPC_CHANNELS.AUTH_CREATE_USER, data),
    update: (id: number, data: Partial<{ fullName: string; role: AdminRole; preferredLanguage: Language; isActive: boolean; password?: string }>) =>
      invoke<any>(IPC_CHANNELS.AUTH_UPDATE_USER, { id, ...data }),
    delete: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.AUTH_DELETE_USER, { id }),
  },

  students: {
    list: (opts?: { page?: number; pageSize?: number; search?: string; status?: string; courseId?: number; teacherId?: number; groupId?: number }) =>
      invoke<PaginatedResult<Student & { paymentStatus?: string; netBalance?: number; groupNames?: string }>>(IPC_CHANNELS.STUDENTS_LIST, opts),
    getById: (id: number) =>
      invoke<Student>(IPC_CHANNELS.STUDENTS_GET, { id }),
    create: (data: {
      firstNameAr: string; lastNameAr: string; firstNameFr: string; lastNameFr: string
      gender: 'male' | 'female'; dateOfBirth?: string | null; phone?: string | null
      guardianName?: string | null; guardianRelationship?: string | null
      guardianPhone?: string | null; secondaryPhone?: string | null; address?: string | null
    }) => invoke<Student>(IPC_CHANNELS.STUDENTS_CREATE, data),
    update: (id: number, data: Partial<{
      firstNameAr: string; lastNameAr: string; firstNameFr: string; lastNameFr: string
      gender: 'male' | 'female'; dateOfBirth: string | null; phone: string | null
      guardianName: string | null; status: string; photoPath: string | null
    }>) => invoke<Student>(IPC_CHANNELS.STUDENTS_UPDATE, { id, ...data }),
    archive: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.STUDENTS_ARCHIVE, { id }),
    regenQR: (id: number) =>
      invoke<{ token: string }>(IPC_CHANNELS.STUDENTS_REGEN_QR, { id }),
    getPhotoUrl: (filename: string, entityType: 'student' | 'teacher') =>
      invoke<{ dataUrl: string | null }>(IPC_CHANNELS.STUDENTS_GET_PHOTO_URL, { filename, entityType }),
    searchByName: (query: string) =>
      invoke<any[]>(IPC_CHANNELS.STUDENTS_SEARCH_NAME, { query }),
    getAttendanceHistory: (studentId: number) =>
      invoke<any[]>('students:attendanceHistory', { studentId }),
    timeline: (studentId: number) =>
      invoke<TimelineEvent[]>(IPC_CHANNELS.STUDENTS_TIMELINE, { studentId }),
  },

  guardians: {
    list: (opts?: { search?: string; limit?: number; offset?: number }) =>
      invoke<{ items: Guardian[]; total: number }>(IPC_CHANNELS.GUARDIANS_LIST, opts),
    getById: (id: number) =>
      invoke<Guardian | null>(IPC_CHANNELS.GUARDIANS_GET, { id }),
    create: (data: { fullName: string; phone?: string | null; whatsappPhone?: string | null; email?: string | null; address?: string | null; notes?: string | null }) =>
      invoke<Guardian>(IPC_CHANNELS.GUARDIANS_CREATE, data),
    update: (id: number, data: Partial<{ fullName: string; phone: string | null; whatsappPhone: string | null; email: string | null; address: string | null; notes: string | null }>) =>
      invoke<Guardian>(IPC_CHANNELS.GUARDIANS_UPDATE, { id, ...data }),
    delete: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.GUARDIANS_DELETE, { id }),
    familySummary: (guardianId: number) =>
      invoke<FamilySummary>(IPC_CHANNELS.GUARDIANS_FAMILY_SUMMARY, { guardianId }),
    linkStudent: (data: { studentId: number; guardianId: number; relationship?: string; isPrimaryContact?: boolean; isEmergencyContact?: boolean }) =>
      invoke<StudentGuardianLink>('guardians:linkStudent', data),
    unlinkStudent: (studentId: number, guardianId: number) =>
      invoke<boolean>('guardians:unlinkStudent', { studentId, guardianId }),
    forStudent: (studentId: number) =>
      invoke<Array<{ link: StudentGuardianLink; guardian: Guardian }>>('guardians:forStudent', { studentId }),
  },

  cards: {
    getByStudent: (studentId: number) =>
      invoke<{ cards: StudentCardInfo[]; activeCard: StudentCardInfo | null }>(IPC_CHANNELS.CARDS_GET_BY_STUDENT, { studentId }),
    issue: (studentId: number, opts?: { expiresAt?: string; notes?: string }) =>
      invoke<StudentCardInfo>(IPC_CHANNELS.CARDS_ISSUE, { studentId, ...opts }),
    markLost: (cardId: number, notes?: string) =>
      invoke<StudentCardInfo>(IPC_CHANNELS.CARDS_MARK_LOST, { cardId, notes }),
    replace: (oldCardId: number, opts?: { reason?: string; expiresAt?: string }) =>
      invoke<StudentCardInfo>(IPC_CHANNELS.CARDS_REPLACE, { oldCardId, ...opts }),
    disable: (cardId: number, notes?: string) =>
      invoke<StudentCardInfo>(IPC_CHANNELS.CARDS_DISABLE, { cardId, notes }),
    resolveToken: (token: string) =>
      invoke<any>(IPC_CHANNELS.CARDS_RESOLVE_TOKEN, { token }),
  },

  documents: {
    list: (studentId: number) =>
      invoke<StudentDocument[]>(IPC_CHANNELS.DOCUMENTS_LIST, { studentId }),
    upload: (studentId: number, documentType: DocumentType, sourceFilePath?: string, customName?: string) =>
      invoke<StudentDocument | null>(IPC_CHANNELS.DOCUMENTS_UPLOAD, { studentId, documentType, sourceFilePath, customName }),
    delete: (documentId: number) =>
      invoke<boolean>(IPC_CHANNELS.DOCUMENTS_DELETE, { documentId }),
    getUrl: (documentId: number) =>
      invoke<{ filePath: string }>(IPC_CHANNELS.DOCUMENTS_GET_URL, { documentId }),
  },

  whatsapp: {
    getTemplates: () =>
      invoke<WhatsAppTemplate[]>(IPC_CHANNELS.WHATSAPP_GET_TEMPLATES),
    updateTemplate: (id: number, data: Partial<Pick<WhatsAppTemplate, 'bodyAr' | 'bodyFr' | 'bodyEn' | 'nameAr' | 'nameFr' | 'nameEn' | 'isActive'>>) =>
      invoke<WhatsAppTemplate>(IPC_CHANNELS.WHATSAPP_UPDATE_TEMPLATE, { id, ...data }),
    open: (phone: string, templateKey: string, params?: Record<string, string>, lang?: 'ar' | 'fr' | 'en') =>
      invoke<string>(IPC_CHANNELS.WHATSAPP_OPEN, { phone, templateKey, params, lang }),
    normalizePhone: (phone: string) =>
      invoke<{ normalized: string }>('whatsapp:normalizePhone', { phone }),
  },

  import: {
    preview: (filePath?: string) =>
      invoke<{ fileName: string; headers: string[]; sampleRows: Record<string, string>[]; totalRowsEstimate: number; filePath: string } | null>(
        IPC_CHANNELS.IMPORT_PREVIEW,
        filePath ? { filePath } : undefined
      ),
    execute: (filePath: string, mapping: any, options?: { skipHeader?: boolean; defaultGender?: 'male' | 'female'; createCards?: boolean; autoLinkGroups?: boolean }) =>
      invoke<{ importedCount: number; skippedCount: number; duplicateCount: number; errorCount: number; errors: Array<{ row: number; error: string }> }>(
        IPC_CHANNELS.IMPORT_EXECUTE,
        { filePath, mapping, options }
      ),
  },

  diagnostics: {
    run: () =>
      invoke<DiagnosticsReport>(IPC_CHANNELS.DIAGNOSTICS_RUN),
    exportSupportPackage: (destinationPath?: string) =>
      invoke<{ canceled: boolean; zipPath?: string }>(IPC_CHANNELS.DIAGNOSTICS_EXPORT_SUPPORT_PACKAGE, { destinationPath }),
  },

  search: {
    global: (query: string) =>
      invoke<GlobalSearchResult>(IPC_CHANNELS.SEARCH_GLOBAL, { query }),
  },

  notifications: {
    list: () =>
      invoke<Array<{ id: string; type: string; title: string; message: string; severity: 'info' | 'warning' | 'critical'; timestamp: string; actionLink?: string }>>(
        IPC_CHANNELS.NOTIFICATIONS_LIST
      ),
    dismiss: (id: string) =>
      invoke<boolean>(IPC_CHANNELS.NOTIFICATIONS_DISMISS, { id }),
  },

  teachers: {
    list: (opts?: { status?: string; courseId?: number }) =>
      invoke<Teacher[]>(IPC_CHANNELS.TEACHERS_LIST, opts),
    create: (data: { firstName: string; lastName: string; phone?: string | null; email?: string | null; address?: string | null; photoPath?: string | null }) =>
      invoke<Teacher>(IPC_CHANNELS.TEACHERS_CREATE, data),
    update: (id: number, data: Partial<{ firstName: string; lastName: string; phone: string | null; email: string | null; address: string | null; status: string; photoPath: string | null }>) =>
      invoke<Teacher>(IPC_CHANNELS.TEACHERS_UPDATE, { id, ...data }),
    archive: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.TEACHERS_ARCHIVE, { id }),
  },

  courses: {
    list: (opts?: { status?: string }) =>
      invoke<Course[]>(IPC_CHANNELS.COURSES_LIST, opts),
    create: (data: { nameAr: string; nameFr: string; nameEn?: string; defaultPrice: number; descriptionAr?: string | null; descriptionFr?: string | null; billingModel?: string }) =>
      invoke<Course>(IPC_CHANNELS.COURSES_CREATE, data),
    update: (id: number, data: Partial<{ nameAr: string; nameFr: string; defaultPrice: number; status: string; billingModel?: string }>) =>
      invoke<Course>(IPC_CHANNELS.COURSES_UPDATE, { id, ...data }),
    delete: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.COURSES_DELETE, { id }),
  },

  groups: {
    list: (opts?: { courseId?: number; status?: string }) =>
      invoke<Group[]>(IPC_CHANNELS.GROUPS_LIST, opts),
    byCourse: (courseId: number) =>
      invoke<Group[]>(IPC_CHANNELS.GROUPS_BY_COURSE, { courseId }),
    create: (data: { courseId: number; teacherId: number; name: string; capacity: number; monthlyPrice: number; startDate: string; endDate?: string | null; room?: string | null; scheduleJson?: string | null }) =>
      invoke<Group>(IPC_CHANNELS.GROUPS_CREATE, data),
    update: (id: number, data: Partial<{ name: string; room: string | null; capacity: number; monthlyPrice: number; status: string }>) =>
      invoke<Group>(IPC_CHANNELS.GROUPS_UPDATE, { id, ...data }),
    delete: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.GROUPS_DELETE, { id }),
  },

  enrollments: {
    create: (data: { studentId: number; groupId: number; agreedPrice: number; enrollmentDate: string }) =>
      invoke<Enrollment>(IPC_CHANNELS.ENROLLMENTS_CREATE, data),
    update: (id: number, data: Partial<{ status: 'active' | 'inactive' | 'completed'; agreedPrice: number }>) =>
      invoke<Enrollment>(IPC_CHANNELS.ENROLLMENTS_UPDATE, { id, ...data }),
    byStudent: (studentId: number) =>
      invoke<Enrollment[]>(IPC_CHANNELS.ENROLLMENTS_BY_STUDENT, { studentId }),
    byGroup: (groupId: number) =>
      invoke<Enrollment[]>(IPC_CHANNELS.ENROLLMENTS_BY_GROUP, { groupId }),
    cancel: (enrollmentId: number, studentId: number, reason?: string) =>
      invoke<{ refunded: number }>('payments:cancelEnrollment', { enrollmentId, studentId, reason }),
  },

  attendance: {
    startSession: (data: { groupId: number; sessionDate: string; plannedStartTime?: string | null; lateThresholdMinutes?: number }) =>
      invoke<AttendanceSession>(IPC_CHANNELS.ATTENDANCE_START_SESSION, data),
    scan: (sessionId: number, token: string) =>
      invoke<QRScanResult>(IPC_CHANNELS.ATTENDANCE_SCAN, { sessionId, token }),
    markManually: (data: { sessionId: number; studentId: number; attendanceStatus: 'present' | 'absent' | 'late'; notes?: string | null }) =>
      invoke<AttendanceRecord>(IPC_CHANNELS.ATTENDANCE_MARK_MANUAL, data),
    endSession: (sessionId: number) =>
      invoke<boolean>(IPC_CHANNELS.ATTENDANCE_END_SESSION, { sessionId }),
    getSession: (id: number) =>
      invoke<AttendanceSession & { records: AttendanceRecord[] }>(IPC_CHANNELS.ATTENDANCE_GET_SESSION, { id }),
    listSessions: (opts?: { groupId?: number; status?: 'open' | 'closed'; limit?: number }) =>
      invoke<AttendanceSession[]>(IPC_CHANNELS.ATTENDANCE_SESSIONS_LIST, opts),
    lookup: (token: string) =>
      invoke<any>(IPC_CHANNELS.ATTENDANCE_LOOKUP, { token }),
    getStudentSummary: (studentId: number, sessionId?: number) =>
      invoke<any>(IPC_CHANNELS.ATTENDANCE_STUDENT_SUMMARY, { studentId, sessionId }),
    getRemainingSessionsCount: (enrollmentId: number) =>
      invoke<{ count: number }>(IPC_CHANNELS.ATTENDANCE_REMAINING_SESSIONS, { enrollmentId }),
    resolveStudent: (token: string, date: string) =>
      invoke<any>(IPC_CHANNELS.ATTENDANCE_RESOLVE_STUDENT, { token, date }),
    markSession: (sessionId: number, studentId: number, status: 'present' | 'absent' | 'late' | 'not_active' | 'inactive') =>
      invoke<any>(IPC_CHANNELS.ATTENDANCE_MARK_SESSION, { sessionId, studentId, status }),
    markAttended: (sessionId: number, studentId: number, source?: 'qr' | 'manual') =>
      invoke<QRScanResult>('attendance:markAttended', { sessionId, studentId, source }),
    reconcile: () =>
      invoke<{ reconciledCount: number }>('attendance:reconcile'),
    markNextNotActive: (studentId: number, groupId: number) =>
      invoke<any>(IPC_CHANNELS.ATTENDANCE_MARK_NEXT_NOT_ACTIVE, { studentId, groupId }),
    getSessionHistory: (studentId: number) =>
      invoke<any[]>('attendance:studentSessionHistory', { studentId }),
    withRoster: (sessionId: number) =>
      invoke<any>(IPC_CHANNELS.SESSIONS_WITH_ROSTER, { sessionId }),
  },

  schedules: {
    list: (opts?: { groupId?: number; active?: boolean }) =>
      invoke<any[]>(IPC_CHANNELS.SCHEDULES_LIST, opts),
    create: (data: { groupId: number; weekday: number; startTime: string; endTime: string; room?: string }) =>
      invoke<any>(IPC_CHANNELS.SCHEDULES_CREATE, data),
    update: (id: number, data: Partial<{ startTime: string; endTime: string; room: string | null; isActive: boolean }>) =>
      invoke<any>(IPC_CHANNELS.SCHEDULES_UPDATE, { id, ...data }),
    delete: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.SCHEDULES_DELETE, { id }),
    listAll: () =>
      invoke<any[]>('schedules:listAll'),
  },

  sessions: {
    list: (opts?: { groupId?: number; status?: 'open' | 'closed'; sessionType?: string }) =>
      invoke<any[]>(IPC_CHANNELS.SESSIONS_LIST, opts),
    get: (id: number) =>
      invoke<any>(IPC_CHANNELS.SESSIONS_GET, { id }),
    createExtra: (data: { groupId: number; sessionDate: string; startTime: string; endTime: string; room?: string; teacherId?: number; price?: number }) =>
      invoke<any>(IPC_CHANNELS.SESSIONS_CREATE_EXTRA, data),
    generate: (groupId: number, startDate: string, endDate: string) =>
      invoke<{ generated: number; message: string }>(IPC_CHANNELS.SESSIONS_GENERATE, { groupId, startDate, endDate }),
    cancel: (sessionId: number, reason?: string) =>
      invoke<boolean>(IPC_CHANNELS.SESSIONS_CANCEL, { sessionId, reason }),
    complete: (sessionId: number) =>
      invoke<boolean>(IPC_CHANNELS.SESSIONS_COMPLETE, { sessionId }),
    delete: (sessionId: number) =>
      invoke<boolean>(IPC_CHANNELS.SESSIONS_DELETE, { sessionId }),
    upcoming: (opts?: { groupId?: number; limit?: number; todayOnly?: boolean }) =>
      invoke<any[]>(IPC_CHANNELS.SESSIONS_UPCOMING, opts),
    byDate: (startDate: string, endDate: string) =>
      invoke<any[]>(IPC_CHANNELS.SESSIONS_BY_DATE, { startDate, endDate }),
    generateForGroup: (groupId: number) =>
      invoke<{ generated: number; message: string }>('sessions:generateForGroup', { groupId }),
    trimAfterDate: (groupId: number, afterDate: string) =>
      invoke<{ removed: number }>('sessions:trimAfterDate', { groupId, afterDate }),
  },

  payments: {
    list: (opts?: { page?: number; pageSize?: number; search?: string; studentId?: number; type?: string }) =>
      invoke<any>(IPC_CHANNELS.PAYMENTS_LIST, opts),
    create: (data: { studentId: number; enrollmentId: number; billingPeriod?: string; amount: number; paymentMethod: 'cash' | 'transfer' | 'check'; paymentDate: string; reference?: string | null; notes?: string | null }) =>
      invoke<any>(IPC_CHANNELS.PAYMENTS_CREATE, data),
    cancel: (id: number, reason?: string | null) =>
      invoke<boolean>(IPC_CHANNELS.PAYMENTS_CANCEL, { id, reason }),
    byStudent: (studentId: number) =>
      invoke<any[]>(IPC_CHANNELS.PAYMENTS_BY_STUDENT, { studentId }),
    summary: () =>
      invoke<{ monthRevenue: number; todayCollected: number; outstanding: number; overdue: number }>('payments:summary'),
    debtReport: () =>
      invoke<any[]>('payments:debtReport'),
    studentDebt: (studentId: number) =>
      invoke<any>('payments:studentDebt', { studentId }),
    topUp: (data: { studentId: number; enrollmentId: number; amount: number; paymentMethod: 'cash' | 'transfer' | 'check'; paymentDate: string; reference?: string | null; notes?: string | null }) =>
      invoke<any>('payments:topUp', data),
    deductSession: (data: { studentId: number; enrollmentId: number; sessionId: number; sessionDate: string; sessionPrice: number }) =>
      invoke<{ deducted: boolean; newBalance: number; wasInDebt: boolean }>('payments:deductSession', data),
    transfer: (data: { fromEnrollmentId: number; toEnrollmentId: number; studentId: number }) =>
      invoke<{ transferred: number; newFromBalance: number; newToBalance: number }>('payments:transfer', data),
    refund: (data: { enrollmentId: number; studentId: number; notes?: string }) =>
      invoke<{ refunded: number }>('payments:refund', data),
    balance: (enrollmentId: number) =>
      invoke<{ balance: number; totalCharged: number; totalDeducted: number; sessionsUsed: number }>('payments:balance', { enrollmentId }),
    cancelEnrollment: (enrollmentId: number, studentId: number, reason?: string) =>
      invoke<{ refunded: number }>('payments:cancelEnrollment', { enrollmentId, studentId, reason }),
    studentBalance: (studentId: number) =>
      invoke<{
        studentId: number
        totalBalance: number
        isDebt: boolean
        enrollmentBalances: Array<{
          enrollmentId: number
          groupId: number
          groupName: string
          courseNameAr: string
          courseNameFr: string
          balance: number
          isDebt: boolean
          status: string
        }>
      }>('payments:studentBalance', { studentId }),
    listAll: (opts?: { page?: number; pageSize?: number; studentId?: number }) =>
      invoke<any>('payments:listAll', opts),
  },

  notes: {
    list: (studentId: number) =>
      invoke<StudentNote[]>(IPC_CHANNELS.NOTES_LIST, { studentId }),
    create: (data: { studentId: number; noteText: string }) =>
      invoke<StudentNote>(IPC_CHANNELS.NOTES_CREATE, data),
    update: (id: number, noteText: string) =>
      invoke<StudentNote>(IPC_CHANNELS.NOTES_UPDATE, { id, noteText }),
    delete: (id: number) =>
      invoke<boolean>(IPC_CHANNELS.NOTES_DELETE, { id }),
  },

  settings: {
    get: () => invoke<SchoolSettings | null>(IPC_CHANNELS.SETTINGS_GET),
    update: (data: Partial<{
      schoolNameAr: string; schoolNameFr: string; schoolNameEn: string
      phone: string | null; email: string | null; address: string | null
      academicYear: string; currency: string; defaultLanguage: 'ar' | 'fr' | 'en'
      backupDirectory: string | null; automaticBackupEnabled: boolean; backupsToRetain: number
      receiptPrinterName: string | null; receiptPaperWidth: string; autoPrintReceipt: boolean; showPrintDialog: boolean
      primaryColor?: string | null; secondaryColor?: string | null; logoPath?: string | null; schoolLogoPath?: string | null; headerSubtitle?: string | null; schoolType?: string | null
    }>) => invoke<SchoolSettings>(IPC_CHANNELS.SETTINGS_UPDATE, data),
    getAdmin: () =>
      invoke<{ id: number; username: string; fullName: string; role: string; preferredLanguage: string; photoPath: string | null }>(IPC_CHANNELS.SETTINGS_GET_ADMIN),
    updateAdmin: (data: { fullName?: string; username?: string; preferredLanguage?: 'ar' | 'fr' | 'en'; photoPath?: string | null }) =>
      invoke<{ id: number; username: string; fullName: string; role: string; preferredLanguage: string; photoPath: string | null }>(IPC_CHANNELS.SETTINGS_UPDATE_ADMIN, data),
    listAuditLogs: (opts?: { limit?: number; offset?: number; action?: string }) =>
      invoke<any[]>(IPC_CHANNELS.SETTINGS_LIST_AUDIT_LOGS, opts),
    setAutoLock: (minutes: number) =>
      invoke<{ minutes: number }>(IPC_CHANNELS.SETTINGS_AUTO_LOCK_SET, { minutes }),
    getAutoLock: () =>
      invoke<{ minutes: number }>(IPC_CHANNELS.SETTINGS_AUTO_LOCK_GET),
  },

  printer: {
    getList: () => invoke<PrinterInfo[]>(IPC_CHANNELS.PRINTER_GET_LIST),
    printReceipt: (data: ReceiptPrintData) =>
      invoke<{ success: boolean }>(IPC_CHANNELS.PRINTER_PRINT_RECEIPT, data),
    printTest: () =>
      invoke<{ success: boolean }>(IPC_CHANNELS.PRINTER_PRINT_TEST),
  },

  backups: {
    create: (destinationDir?: string) =>
      invoke<BackupInfo>(IPC_CHANNELS.BACKUPS_CREATE, { destinationDir }),
    list: () => invoke<BackupInfo[]>(IPC_CHANNELS.BACKUPS_LIST),
    verify: (backupPath: string) =>
      invoke<{ verified: boolean }>(IPC_CHANNELS.BACKUPS_VERIFY, { backupPath }),
    restore: (backupPath: string, confirmPassword?: string) =>
      invoke<boolean>(IPC_CHANNELS.BACKUPS_RESTORE, { backupPath, confirmPassword: confirmPassword || '' }),
  },

  media: {
    selectImage: (type: 'admin' | 'student' | 'teacher', recordId: string) =>
      invoke<{ success: boolean; path: string | null; error: string | null }>(IPC_CHANNELS.MEDIA_SELECT_IMAGE, { type, recordId }),
    deleteImage: (relativePath: string) =>
      invoke<{ success: boolean; error: string | null }>(IPC_CHANNELS.MEDIA_DELETE_IMAGE, { relativePath }),
    getImageUrl: (relativePath?: string) =>
      invoke<{ url: string | null; error?: string | null }>(IPC_CHANNELS.MEDIA_GET_IMAGE_URL, { relativePath }),
    uploadPhoto: (sourcePath: string, entityType: 'student' | 'teacher', entityId: number) =>
      invoke<{ filename: string }>(IPC_CHANNELS.MEDIA_UPLOAD_PHOTO, { sourcePath, entityType, entityId }),
  },

  app: {
    getVersion: () => invoke<{ version: string; name: string }>(IPC_CHANNELS.APP_GET_VERSION),
    getPaths: () => invoke<{ userData: string; documents: string }>(IPC_CHANNELS.APP_GET_PATHS),
    openBackupDialog: () => invoke<{ canceled: boolean; path: string | null }>(IPC_CHANNELS.APP_OPEN_BACKUP_DIALOG),
    openSaveDialog: () => invoke<{ canceled: boolean; path: string | null }>(IPC_CHANNELS.APP_SHOW_SAVE_DIALOG),
    print: () => invoke<boolean>(IPC_CHANNELS.APP_PRINT),
    printToPdf: (opts?: { pageSize?: 'A4' | 'Letter'; marginsType?: 0 | 1 | 2; filename?: string }) => invoke<{ path: string }>(IPC_CHANNELS.APP_PRINT_TO_PDF, opts),
    logError: (details: { category?: string; message?: string; componentStack?: string }) =>
      invoke<boolean>(IPC_CHANNELS.APP_LOG_ERROR, details),
  },
} as const

console.log('[Preload] started')

// ─── Expose via contextBridge (the ONLY bridge to Node.js) ───────────────────────────────────
contextBridge.exposeInMainWorld('schoolApp', api)

console.log('[Preload] schoolApp exposed')

// ─── TypeScript declaration for renderer ─────────────────────────────────────
export type SchoolAppAPI = typeof api
