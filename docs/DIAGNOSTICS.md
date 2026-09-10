# EduPilot 2.0 Commercial — System Health & Diagnostics Engine

## 1. Overview

Because EduPilot 2.0 Commercial is deployed in production desktop environments across diverse Windows editions (Windows 10, Windows 11, Windows Server), it features an automated, built-in diagnostic and self-healing engine (`diagnostics.service.ts`).

The diagnostic subsystem enables school administrators and IT technicians to inspect system integrity, storage health, and database performance directly from the UI (**Settings -> System Diagnostics**).

---

## 2. Automated Diagnostic Tests

Executing a system diagnostic scan runs the following comprehensive suite of checks:

| Check ID | Component Tested | Pass Condition | Warning / Failure Action |
| :--- | :--- | :--- | :--- |
| `sqlite_integrity` | SQLite Database PRAGMA | `PRAGMA integrity_check` returns `'ok'` | Alerts administrator of corruption; recommends instant snapshot restore |
| `sqlite_quick` | SQLite Quick Check | `PRAGMA quick_check` returns `'ok'` | Identifies table index anomalies |
| `foreign_keys` | Relational Integrity | `PRAGMA foreign_key_check` returns 0 rows | Identifies orphaned records across tables |
| `schema_version` | Migration Alignment | Schema version matches target (v11) | Re-applies pending schema migrations |
| `disk_space` | Free Storage Space | Free disk space on AppData drive > 2.0 GB | Warns staff if storage capacity is low |
| `file_permissions` | Write Permissions | Ability to create, write, and delete temp files in `%APPDATA%/Edupilot-2-Commercial` | Alerts of Windows read-only or permission blocks |
| `backup_status` | Disaster Recovery Health | Valid backup created within the last 7 days | Warns that backups are overdue |
| `printer_service` | Print Subsystem | System print spooler responds to enumeration | Indicates whether receipts can be dispatched |

---

## 3. Sanitized Technical Support Package Export

When an institution encounters a technical issue or requires customer support, clicking **"Export Technical Support Package"** generates a compressed ZIP archive containing:

1. `diagnostics_report.json`: JSON output of all system checks, schema version, OS build, Node/Electron versions, and storage stats.
2. `schema_stats.json`: Row counts and table sizes across all tables (with zero student rows).
3. `app.log` / `error.log`: Anonymized application logs containing timestamps and stack traces.

### Absolute Privacy Guarantee:
- **No Personal Identifiable Information (PII)** is ever included in the support package.
- Student names, guardian contact numbers, photos, documents, and financial figures are completely excluded or hashed before ZIP generation.
- The exported ZIP file is saved to `%USERPROFILE%/Downloads/edupilot_support_package_<timestamp>.zip` for easy transmission to technical support.
