# EduPilot 2.0 Commercial — Architecture & Security Specification

## 1. Executive Overview

**EduPilot 2.0 Commercial** (`v2.0.0`) is a standalone, enterprise-grade school management platform engineered specifically for private schools, tutoring academies, and educational institutions in Algeria and the MENA region.

The system is constructed as an **offline-first desktop application** running on the Electron runtime with a React + TypeScript frontend and an embedded SQLite database. It requires zero cloud infrastructure, operates 100% without an active internet connection, and guarantees absolute data sovereignty to the school.

```
+-----------------------------------------------------------------------+
|                       EduPilot 2.0 Commercial                         |
+-----------------------------------------------------------------------+
|  Renderer Process (Chromium / React 19 / Tailwind CSS v4)             |
|    - Context Isolation: TRUE                                          |
|    - Node Integration: FALSE                                          |
|    - Sandboxed IPC Gateway                                            |
+-----------------------------------------------------------------------+
                                  |
                                  | window.schoolApp.* (ContextBridge)
                                  v
+-----------------------------------------------------------------------+
|  Preload Script (Strictly Typed IPC Invocations)                      |
|    - Exposes whitelist of 60+ domain methods                         |
|    - Zero direct Node.js or filesystem exposure                       |
+-----------------------------------------------------------------------+
                                  |
                                  | ipcRenderer.invoke / ipcMain.handle
                                  v
+-----------------------------------------------------------------------+
|  Electron Main Process (Node.js 20+ Runtime)                         |
|    - Lifecycle Management (Single Instance Lock)                      |
|    - Window Security & Native Dialogs                                 |
|    - Domain Services:                                                 |
|        * student.service.ts       * guardians.service.ts              |
|        * cards.service.ts         * documents.service.ts              |
|        * whatsapp.service.ts      * import.service.ts                 |
|        * diagnostics.service.ts   * search.service.ts                 |
|        * backup.service.ts        * print.service.ts                  |
+-----------------------------------------------------------------------+
                                  |
                                  | Synchronous C-Bindings (C++)
                                  v
+-----------------------------------------------------------------------+
|  Embedded Database Layer (Better-SQLite3)                             |
|    - %APPDATA%/Edupilot-2-Commercial/edupilot-v2.sqlite               |
|    - PRAGMA journal_mode = WAL                                        |
|    - PRAGMA foreign_keys = ON                                         |
|    - PRAGMA synchronous = NORMAL                                      |
+-----------------------------------------------------------------------+
```

---

## 2. Process Model & Process Security

### 2.1 Context Isolation & Preload Boundary
Security in EduPilot 2.0 Commercial adheres strictly to the Principle of Least Privilege:
- **`contextIsolation: true`**: The renderer execution context is strictly isolated from the preload and main process contexts.
- **`nodeIntegration: false`**: The renderer cannot access Node globals (`process`, `require`, `Buffer`, `fs`).
- **`sandbox: false`** (configured for native C++ bindings compatibility with `better-sqlite3` and native printer APIs in the main process, while preload sanitizes renderer input).
- **`webSecurity: true`**: Same-Origin Policy is enforced. File system paths are never exposed directly to the DOM; media assets are served through base64 data URIs or registered safe protocols.

### 2.2 Typed IPC Gateway
Communication between the Renderer and Main process is mediated exclusively by `src/preload/preload.ts`, typed via `Window['schoolApp']`. The IPC channels are enumerated in `src/shared/types/ipc.ts`.
- Every IPC invocation uses `ipcRenderer.invoke(channel, ...args)` returning a standardized `Promise<ApiResult<T>>`.
- The Main process verifies input arguments and active session credentials before executing service logic.

---

## 3. Data Layer & Storage Architecture

### 3.1 Embedded SQLite (`better-sqlite3`)
The database engine is `better-sqlite3`, a high-performance synchronous C++ binding to SQLite 3.
- **Concurrency**: Write-Ahead Logging (`WAL` mode) allows concurrent read operations while writes are serialized and committed atomically.
- **Integrity**: `PRAGMA foreign_keys = ON` is enforced on every database connection initialization.
- **Zero Configuration**: No database server daemon (MySQL, PostgreSQL) is required. The database exists as a single, portable file: `edupilot-v2.sqlite`.

### 3.2 File Vault Structure
All local assets generated by EduPilot 2.0 Commercial are stored under `%APPDATA%/Edupilot-2-Commercial/`:
```
%APPDATA%/Edupilot-2-Commercial/
|-- edupilot-v2.sqlite          # Primary transactional database
|-- edupilot-v2.sqlite-wal      # Write-Ahead Log
|-- edupilot-v2.sqlite-shm      # Shared memory index
|-- uploads/
|   |-- logos/                  # Institutional school logos
|   |-- student-photos/         # Student portrait photos
|   |-- documents/              # Student document vault (certificates, IDs)
|-- logs/
|   |-- app.log                 # General operational logs
|   |-- error.log               # Uncaught exceptions and crash dumps
|-- session.json                # Encrypted session persistence (if enabled)
```

---

## 4. 100% Offline Operational Guarantee

EduPilot 2.0 Commercial has **zero hard dependencies on the internet**:
1. **Local Bundling**: All JavaScript, CSS, SVGs, and fonts (Inter, Cairo) are bundled statically within the application binary.
2. **Zero Telemetry**: No tracking beacons, analytics scripts, or remote heartbeat calls exist in the codebase.
3. **Local Printing & QR**: Receipt rendering and CR80 ID Card generation utilize local SVG/Canvas rendering and local thermal printer spoolers.
4. **WhatsApp Dispatch**: WhatsApp messaging is executed locally via standard URI dispatch (`wa.me` URL launched via Windows default browser handler) with no external WhatsApp API gateway or recurring billing.
