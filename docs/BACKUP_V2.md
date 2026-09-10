# EduPilot 2.0 Commercial — Database Backup & Disaster Recovery (v2)

## 1. Complete Isolation from Version 1.0.0

EduPilot 2.0 Commercial introduces a completely segregated, high-integrity backup subsystem (`backup.service.ts`).

### Key Isolation Guarantees:
- **Default Backup Directory**: `%USERPROFILE%/Documents/Edupilot-2-Backups/`
  *(EduPilot 1.0 backups stored in `%USERPROFILE%/Documents/Edupilot-Backups/` are never touched, read, or overwritten).*
- **Naming Pattern**: `edupilot_v2_backup_YYYY-MM-DD_HHmmss.sqlite`
- **Integrity Validation**: Every backup archive is automatically checksummed with SHA-256 upon creation and verified before any restore attempt.

---

## 2. Backup Mechanisms

### 2.1 Online Hot Backup (`better-sqlite3.backup()`)
EduPilot 2.0 utilizes SQLite's native online backup API:
- Backups occur live while the application is running without locking or interrupting active user sessions.
- Pages are copied incrementally with WAL journaling consistency.
- Zero risk of partial or truncated database writes.

### 2.2 Automatic Scheduled / Lifecycle Backups
- If `automaticBackupEnabled` is active in `school_settings`:
  - An automatic backup snapshot is created upon application launch and during graceful application exit.
  - An automated rotation engine retains the latest `N` backups (default: `10` archives), automatically pruning older archives to conserve disk space.

---

## 3. Disaster Recovery & Restoration Protocol

Restoring a database snapshot is a mission-critical operation protected by multiple safeguards:

```
+-----------------------------------------------------------------------+
|  1. Administrator selects target snapshot (*.sqlite)                 |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  2. Pre-Restore Integrity Check                                       |
|     - Verifies SQLite header magic bytes (0x53 0x51 0x4C 0x69 0x74 0x65|
|     - Executes PRAGMA integrity_check on the target snapshot          |
|     - Validates schema_version >= 11 (Rejects incompatible 1.0 DBs)   |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  3. Safety Pre-Restore Snapshot                                       |
|     - System automatically backs up the current live database to:     |
|       pre_restore_safety_backup_YYYY-MM-DD_HHmmss.sqlite              |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  4. Atomic Database Swap & Connection Reset                           |
|     - Closes existing better-sqlite3 connection pool                  |
|     - Atomically overwrites edupilot-v2.sqlite                        |
|     - Reinitializes connection, WAL mode, and verifies table counts   |
|     - Dispatches notification to reload frontend state                |
+-----------------------------------------------------------------------+
```

---

## 4. Off-Site Storage Recommendations for Schools

For maximum protection against physical hardware failure or ransomware:
1. Staff should configure an external USB Flash Drive or Network-Attached Storage (NAS) as the secondary backup destination in **Settings -> Backup**.
2. EduPilot 2.0 allows manual export of individual timestamped `.sqlite` backups with a single click in the UI.
