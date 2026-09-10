export const APP_NAME = 'Edupilot'
export const APP_EDITION = 'Commercial Edition'
export const APP_VERSION = '2.0.0'
export const APP_ID = 'com.edupilot.commercial.v2'
export const USER_DATA_DIR_NAME = 'Edupilot-2-Commercial'
export const USER_DATA_DEV_DIR_NAME = 'Edupilot-2-Commercial-Dev'
export const DB_FILENAME = 'database/edupilot-v2.sqlite'
export const BACKUP_NAMESPACE = 'Edupilot-2-Backups'
export const MEDIA_DIR = 'media'
export const STUDENTS_PHOTO_DIR = 'media/students'
export const TEACHERS_PHOTO_DIR = 'media/teachers'
export const ADMINS_PHOTO_DIR = 'media/administrators'
export const GUARDIANS_PHOTO_DIR = 'media/guardians'
export const SCHOOL_PHOTO_DIR = 'media/school'
export const DOCUMENTS_DIR = 'media/documents'
export const LOG_DIR = 'logs'
export const BACKUP_DIR_DEFAULT = 'backups'

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const QR_TOKEN_PREFIX = 'EDP2:'
export const QR_TOKEN_BYTES = 24

export const MAX_FAILED_LOGINS = 5
export const LOCKOUT_DURATION_MINUTES = 15

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

export const DEFAULT_LATE_THRESHOLD_MINUTES = 10
export const DEFAULT_BACKUPS_TO_RETAIN = 30
export const DEFAULT_CURRENCY = 'DZD'
export const DEFAULT_LANGUAGE = 'ar' as const
export const DEFAULT_STUDENT_NUMBER_PREFIX = 'ETU'
export const DEFAULT_RECEIPT_PREFIX = 'REC'

export const IPC_CHANNELS = {
  // Health
  HEALTH_CHECK: 'health:check',

  // Auth & RBAC
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHANGE_PASSWORD: 'auth:changePassword',
  AUTH_GET_SESSION: 'auth:getSession',
  AUTH_CHECK_FIRST_RUN: 'auth:checkFirstRun',
  AUTH_COMPLETE_SETUP: 'auth:completeSetup',
  AUTH_LIST_USERS: 'auth:listUsers',
  AUTH_CREATE_USER: 'auth:createUser',
  AUTH_UPDATE_USER: 'auth:updateUser',
  AUTH_DELETE_USER: 'auth:deleteUser',

  // Students
  STUDENTS_LIST: 'students:list',
  STUDENTS_GET: 'students:getById',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_UPDATE: 'students:update',
  STUDENTS_ARCHIVE: 'students:archive',
  STUDENTS_REGEN_QR: 'students:regenQR',
  STUDENTS_GET_PHOTO_URL: 'students:getPhotoUrl',
  STUDENTS_TIMELINE: 'students:timeline',

  // Guardians / Family
  GUARDIANS_LIST: 'guardians:list',
  GUARDIANS_GET: 'guardians:getById',
  GUARDIANS_CREATE: 'guardians:create',
  GUARDIANS_UPDATE: 'guardians:update',
  GUARDIANS_DELETE: 'guardians:delete',
  GUARDIANS_FAMILY_SUMMARY: 'guardians:familySummary',

  // Student Cards & QR Lifecycle
  CARDS_GET_BY_STUDENT: 'cards:getByStudent',
  CARDS_ISSUE: 'cards:issue',
  CARDS_MARK_LOST: 'cards:markLost',
  CARDS_REPLACE: 'cards:replace',
  CARDS_DISABLE: 'cards:disable',
  CARDS_RESOLVE_TOKEN: 'cards:resolveToken',

  // Student Documents
  DOCUMENTS_LIST: 'documents:list',
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_DELETE: 'documents:delete',
  DOCUMENTS_GET_URL: 'documents:getUrl',

  // Teachers
  TEACHERS_LIST: 'teachers:list',
  TEACHERS_GET: 'teachers:getById',
  TEACHERS_CREATE: 'teachers:create',
  TEACHERS_UPDATE: 'teachers:update',
  TEACHERS_ARCHIVE: 'teachers:archive',

  // Courses
  COURSES_LIST: 'courses:list',
  COURSES_GET: 'courses:getById',
  COURSES_CREATE: 'courses:create',
  COURSES_UPDATE: 'courses:update',
  COURSES_DELETE: 'courses:delete',

  // Groups
  GROUPS_LIST: 'groups:list',
  GROUPS_GET: 'groups:getById',
  GROUPS_CREATE: 'groups:create',
  GROUPS_UPDATE: 'groups:update',
  GROUPS_DELETE: 'groups:delete',
  GROUPS_BY_COURSE: 'groups:byCourse',

  // Enrollments
  ENROLLMENTS_LIST: 'enrollments:list',
  ENROLLMENTS_CREATE: 'enrollments:create',
  ENROLLMENTS_UPDATE: 'enrollments:update',
  ENROLLMENTS_CANCEL: 'enrollments:cancel',
  ENROLLMENTS_BY_STUDENT: 'enrollments:byStudent',
  ENROLLMENTS_BY_GROUP: 'enrollments:byGroup',

  // Attendance
  ATTENDANCE_START_SESSION: 'attendance:startSession',
  ATTENDANCE_SCAN: 'attendance:scan',
  ATTENDANCE_MARK_MANUAL: 'attendance:markManually',
  ATTENDANCE_END_SESSION: 'attendance:endSession',
  ATTENDANCE_GET_SESSION: 'attendance:getSession',
  ATTENDANCE_SESSIONS_LIST: 'attendance:sessionsList',
  ATTENDANCE_RECORDS: 'attendance:records',
  ATTENDANCE_RESOLVE_STUDENT: 'attendance:resolveStudent',
  ATTENDANCE_MARK_SESSION: 'attendance:markSession',
  ATTENDANCE_MARK_NEXT_NOT_ACTIVE: 'attendance:markNextNotActive',
  ATTENDANCE_LOOKUP: 'attendance:lookup',
  ATTENDANCE_STUDENT_SUMMARY: 'attendance:studentSummary',
  ATTENDANCE_REMAINING_SESSIONS: 'attendance:remainingSessions',
  SESSIONS_BY_DATE: 'sessions:byDate',
  SESSIONS_WITH_ROSTER: 'sessions:withRoster',
  STUDENTS_SEARCH_NAME: 'students:searchByName',

  // Payments & Financial Ledger
  PAYMENTS_LIST: 'payments:list',
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_CANCEL: 'payments:cancel',
  PAYMENTS_BY_STUDENT: 'payments:byStudent',
  PAYMENTS_PRINT_RECEIPT: 'payments:printReceipt',
  PAYMENTS_LEDGER_LIST: 'payments:ledgerList',

  // Reports
  REPORTS_GENERATE: 'reports:generate',

  // Backups
  BACKUPS_CREATE: 'backups:create',
  BACKUPS_RESTORE: 'backups:restore',
  BACKUPS_LIST: 'backups:list',
  BACKUPS_VERIFY: 'backups:verify',
  BACKUPS_STATUS: 'backups:status',

  // Schedules (recurring weekly slots)
  SCHEDULES_LIST: 'schedules:list',
  SCHEDULES_CREATE: 'schedules:create',
  SCHEDULES_UPDATE: 'schedules:update',
  SCHEDULES_DELETE: 'schedules:delete',

  // Sessions (instances of lessons)
  SESSIONS_LIST: 'sessions:list',
  SESSIONS_GET: 'sessions:get',
  SESSIONS_CREATE_EXTRA: 'sessions:createExtra',
  SESSIONS_GENERATE: 'sessions:generate',
  SESSIONS_CANCEL: 'sessions:cancel',
  SESSIONS_COMPLETE: 'sessions:complete',
  SESSIONS_DELETE: 'sessions:delete',
  SESSIONS_UPCOMING: 'sessions:upcoming',

  // WhatsApp & Communication
  WHATSAPP_OPEN: 'whatsapp:open',
  WHATSAPP_GET_TEMPLATES: 'whatsapp:getTemplates',
  WHATSAPP_UPDATE_TEMPLATE: 'whatsapp:updateTemplate',

  // Student Import
  IMPORT_PREVIEW: 'import:preview',
  IMPORT_EXECUTE: 'import:execute',

  // Global Search
  SEARCH_GLOBAL: 'search:global',

  // Notifications
  NOTIFICATIONS_LIST: 'notifications:list',
  NOTIFICATIONS_DISMISS: 'notifications:dismiss',

  // Diagnostics & Support
  DIAGNOSTICS_RUN: 'diagnostics:run',
  DIAGNOSTICS_EXPORT_SUPPORT_PACKAGE: 'diagnostics:exportSupportPackage',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_GET_ADMIN: 'settings:getAdmin',
  SETTINGS_UPDATE_ADMIN: 'settings:updateAdmin',
  SETTINGS_LIST_AUDIT_LOGS: 'settings:listAuditLogs',
  SETTINGS_AUTO_LOCK_SET: 'settings:setAutoLock',
  SETTINGS_AUTO_LOCK_GET: 'settings:getAutoLock',

  // Media
  MEDIA_SELECT_IMAGE: 'media:selectImage',
  MEDIA_DELETE_IMAGE: 'media:deleteImage',
  MEDIA_GET_IMAGE_URL: 'media:getImageUrl',
  MEDIA_UPLOAD_PHOTO: 'media:uploadPhoto',
  MEDIA_GET_URL: 'media:getUrl',

  // Notes
  NOTES_LIST: 'notes:list',
  NOTES_CREATE: 'notes:create',
  NOTES_UPDATE: 'notes:update',
  NOTES_DELETE: 'notes:delete',

  // Printer
  PRINTER_GET_LIST: 'printer:getList',
  PRINTER_PRINT_RECEIPT: 'printer:printReceipt',
  PRINTER_PRINT_TEST: 'printer:printTest',

  // App
  APP_GET_VERSION: 'app:getVersion',
  APP_GET_PATHS: 'app:getPaths',
  APP_OPEN_BACKUP_DIALOG: 'app:openBackupDialog',
  APP_OPEN_RESTORE_DIALOG: 'app:openRestoreDialog',
  APP_PRINT: 'app:print',
  APP_PRINT_TO_PDF: 'app:printToPdf',
  APP_SHOW_SAVE_DIALOG: 'app:showSaveDialog',
  APP_LOG_ERROR: 'app:logError',
} as const
