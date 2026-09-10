# EduPilot 2.0 Commercial — Version 1.0 vs Version 2.0 Isolation Analysis

## 1. Absolute Isolation Guarantee

A fundamental requirement of the EduPilot 2.0 Commercial productization is that **it must run concurrently on machines with EduPilot 1.0.0 installed without conflict, file locking, schema corruption, or accidental overwrites**.

Both versions can be installed on the same Windows computer, run at the exact same time, and have independent lifecycles.

---

## 2. Exhaustive Comparison Matrix

| Property | EduPilot 1.0.0 | EduPilot 2.0 Commercial (v2.0.0) | Isolation Status |
| :--- | :--- | :--- | :---: |
| **Product Display Name** | `Edupilot` | `Edupilot 2.0 Commercial` | **ISOLATED** |
| **Executable Name** | `Edupilot.exe` | `Edupilot2.exe` | **ISOLATED** |
| **AppUserModelId / appId**| `com.edupilot.app` | `com.edupilot.commercial.v2` | **ISOLATED** |
| **AppData Folder** | `%APPDATA%/Edupilot` | `%APPDATA%/Edupilot-2-Commercial`| **ISOLATED** |
| **Primary SQLite Database**| `edupilot.sqlite` | `edupilot-v2.sqlite` | **ISOLATED** |
| **Database Schema Version**| `v10` | `v11+` | **ISOLATED** |
| **Backup Storage Folder** | `%DOCUMENTS%/Edupilot-Backups` | `%DOCUMENTS%/Edupilot-2-Backups` | **ISOLATED** |
| **Backup File Naming** | `edupilot_backup_*.sqlite` | `edupilot_v2_backup_*.sqlite` | **ISOLATED** |
| **Install Directory** | `Local/Programs/Edupilot` | `Local/Programs/Edupilot-2-Commercial` | **ISOLATED** |
| **Desktop Shortcut** | `Edupilot.lnk` | `Edupilot 2.0 Commercial.lnk` | **ISOLATED** |
| **Start Menu Shortcut** | `Edupilot` | `Edupilot 2.0 Commercial` | **ISOLATED** |
| **Single Instance Lock** | `edupilot-app-lock` | `edupilot-2-commercial-lock` | **ISOLATED** |
| **Release Installer** | `release/Edupilot Setup 1.0.0.exe`| `release/v2.0.0/Edupilot-2.0.0-Setup.exe`| **ISOLATED** |

---

## 3. Technical Verification Steps

The following automated and manual tests prove isolation:

1. **Process Concurrency Test**:
   Launch `Edupilot.exe` (1.0.0) and verify process PID. Concurrently launch `Edupilot2.exe` (2.0.0). Both processes exist simultaneously in Windows Task Manager under separate PIDs without port conflicts or mutex collisions.

2. **Database Mutex Test**:
   Perform heavy write transactions (mass attendance scanning or student enrollment) in 2.0.0. Verify that `edupilot.sqlite` (1.0.0) file modification timestamp and WAL files are completely unmodified.

3. **Backup Isolation Test**:
   Execute manual backup in 2.0.0. Check `%DOCUMENTS%/Edupilot-2-Backups/` to confirm the new `edupilot_v2_backup_*.sqlite` is written. Confirm `%DOCUMENTS%/Edupilot-Backups/` remains unaffected.

4. **Uninstaller Test**:
   Run Windows Add/Remove Programs. Edupilot 1.0.0 and Edupilot 2.0 Commercial appear as two distinct independent programs. Uninstalling Edupilot 1.0.0 leaves Edupilot 2.0 Commercial intact, and vice versa.
