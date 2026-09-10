# EduPilot 2.0 Commercial — Data Locations & Filesystem Map

## 1. Primary Directory Structure

EduPilot 2.0 Commercial operates within strictly designated directories on Windows machines. It maintains **zero overlap** with the legacy EduPilot 1.0.0 directories.

```
C:\Users\<Username>\
|-- AppData\
|   |-- Roaming\
|   |   |-- Edupilot-2-Commercial\          <-- APPLICATION DATA ROOT
|   |   |   |-- edupilot-v2.sqlite          <-- PRIMARY SQLITE DATABASE
|   |   |   |-- edupilot-v2.sqlite-wal      <-- WAL JOURNAL FILE
|   |   |   |-- edupilot-v2.sqlite-shm      <-- SHARED MEMORY FILE
|   |   |   |-- session.json                <-- ACTIVE USER SESSION TOKEN
|   |   |   |-- logs\
|   |   |   |   |-- app.log                 <-- APPLICATION LOGS
|   |   |   |   |-- error.log               <-- ERROR LOGS
|   |   |   |-- uploads\
|   |   |   |   |-- logos\                  <-- SCHOOL INSTITUTIONAL LOGOS
|   |   |   |   |-- student-photos\         <-- STUDENT BADGE PHOTOS
|   |   |   |   |-- documents\              <-- STUDENT ATTACHED DOCUMENTS
|   |   |   |-- temp\                       <-- TEMPORARY PRINT/EXPORT BUFFERS
|-- Documents\
|   |-- Edupilot-2-Backups\                 <-- AUTOMATIC & MANUAL BACKUPS
|   |   |-- edupilot_v2_backup_*.sqlite     <-- DATED DATABASE SNAPSHOTS
|-- Desktop\
|   |-- Edupilot 2.0 Commercial.lnk         <-- DESKTOP SHORTCUT
```

---

## 2. Windows Installation Directory

When installed via the standard NSIS installer (`Edupilot-2.0.0-Setup.exe`):

- **Default Installation Path (Per-User)**:
  `C:\Users\<Username>\AppData\Local\Programs\Edupilot-2-Commercial\`
- **Executable Name**:
  `Edupilot2.exe`
- **Application ID (AppUserModelId)**:
  `com.edupilot.commercial.v2`

---

## 3. Windows Registry Keys

EduPilot 2.0 Commercial registers its uninstaller and shortcut keys under isolated keys:

- **Uninstall Registry Key**:
  `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.edupilot.commercial.v2}`
- **Application Registration**:
  `HKCU\Software\Edupilot-2-Commercial`

*(EduPilot 1.0.0 keys at `HKCU\Software\Edupilot` and `{com.edupilot.app}` remain untouched).*
