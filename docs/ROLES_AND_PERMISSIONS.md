# EduPilot 2.0 Commercial — Roles, Permissions & Security (RBAC)

## 1. Role-Based Access Control (RBAC) Matrix

EduPilot 2.0 Commercial incorporates a multi-user, multi-role security engine. Every staff member logs in with unique credentials, ensuring accountability, fine-grained access restrictions, and comprehensive audit trail logging.

### Role Hierarchy
1. **`superadmin`**: Institutional owner / general director. Unrestricted access to all modules, financial reporting, system configurations, user administration, and database backups.
2. **`admin`**: Academic director / principal. Full operational control over students, teachers, courses, attendance, and payments. Cannot alter system-level database or delete audit logs.
3. **`secretary`**: Front-desk registrar / administrative clerk. Manages student enrollments, daily attendance recording, basic fee collection, receipt printing, and guardian communications. Restricted from deleting payments, viewing executive financial margins, or modifying institution settings.
4. **`teacher`**: Instructional staff. View-only access to assigned student rosters, group schedules, and direct attendance taking. No financial or fee data is visible.

---

## 2. Granular Permissions Matrix

| Functional Module | SuperAdmin | Admin | Secretary | Teacher |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard Executive KPIs** | Full | Full | Restricted | None |
| **Student Roster (View / Search)** | Full | Full | Full | Assigned Only |
| **Student Profiles (Create / Edit)** | Full | Full | Full | None |
| **Student Deletion / Archive** | Full | Full | Denied | Denied |
| **Course & Group Management** | Full | Full | View Only | View Assigned |
| **Attendance Recording (QR / Manual)** | Full | Full | Full | Full (Assigned) |
| **Payments & Fee Collection** | Full | Full | Collect Only | Denied |
| **Payment Receipt Deletion / Refund** | Full | Admin Only | Denied | Denied |
| **Cashbox & Daily Expense Tracking** | Full | Full | Denied | Denied |
| **Financial & Revenue Analytics** | Full | Full | Denied | Denied |
| **Student Document Vault (Upload/Del)**| Full | Full | Upload/View | Denied |
| **Student CR80 Card Generation** | Full | Full | Full | Denied |
| **WhatsApp Notification Triggers** | Full | Full | Full | Denied |
| **Data Import (CSV / Excel)** | Full | Full | Denied | Denied |
| **System Settings & White-Labeling** | Full | Denied | Denied | Denied |
| **User Account Management (RBAC)** | Full | View Only | Denied | Denied |
| **Diagnostics & Support Export** | Full | Full | Denied | Denied |
| **Database Backup & Restoration** | Full | Denied | Denied | Denied |

---

## 3. Password Security & Cryptographic Storage

User authentication is secured without reliance on plain-text hashes:
- **Algorithm**: PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256 HMAC.
- **Salting**: Every user record has a unique cryptographically generated salt (minimum 16 bytes).
- **Iterations**: Minimum 10,000 iterations to protect against offline dictionary and rainbow table attacks.
- **Session Security**: Session tokens are held in-memory within the Electron main process and preload bridge. No sensitive password hashes are ever returned to the renderer process.

---

## 4. Audit Logging Engine (`audit_logs`)

All critical operational events are recorded in the `audit_logs` table:
- **Timestamp**: ISO 8601 UTC timestamp
- **Admin ID & Name**: Staff member responsible
- **Action Code**: E.g., `STUDENT_CREATE`, `PAYMENT_RECORD`, `PAYMENT_DELETE`, `SETTINGS_UPDATE`, `BACKUP_RESTORE`
- **Entity Type & ID**: Affected database table and primary key (e.g., `student`, `payment`, `user`)
- **Metadata**: JSON snapshot of affected fields for change tracking and auditing.
