# EduPilot 2.0 Commercial — Release Verification Checklist

## 1. Pre-Build Code Quality & Type Safety
- [x] Full codebase compiles with `pnpm typecheck` (`tsc --noEmit`) with **0 errors**.
- [x] ESLint / oxfmt formatting passes with no critical warnings.
- [x] All native Node.js API calls are constrained to the Main Process.
- [x] All Renderer IPC invocations are typed via `src/preload/preload.ts` and `Window['schoolApp']`.

---

## 2. Security & Data Isolation
- [x] `appId` is verified as `com.edupilot.commercial.v2`.
- [x] Executable output is verified as `Edupilot2.exe`.
- [x] AppData directory resolves to `%APPDATA%/Edupilot-2-Commercial/`.
- [x] Database path resolves to `%APPDATA%/Edupilot-2-Commercial/edupilot-v2.sqlite`.
- [x] Backup directory resolves to `%DOCUMENTS%/Edupilot-2-Backups/`.
- [x] No shared files, registry keys, or database connections with EduPilot 1.0.0.

---

## 3. Commercial Features & Functionality
- [x] **Setup Wizard (`/setup`)**: 6-step guided onboarding completes, saves institutional branding and logo, and initializes superadmin.
- [x] **CR80 Student ID Card**:
  - High-resolution CR80 (85.6mm x 54mm) front and back styling.
  - Deep navy `#0A192F` theme with gold accents and circular watermark.
  - QR code strictly encodes `EDP2:<uuid>` (zero plaintext personal data).
  - Thermal 80mm ticket and A4 8-card sheet print previews render cleanly.
- [x] **Multi-Billing Models**: Supports `monthly_subject`, `monthly_student`, `per_session`, and `per_course`.
- [x] **Guardian Management**: Linking guardians, primary guardian designation, WhatsApp direct messaging.
- [x] **Student Document Vault**: File upload dialog, thumbnail preview, native system file open, and deletion.
- [x] **Data Import**: 3-step CSV/Excel import with auto-column matching and duplicate detection.
- [x] **Global Search**: Modal search (`Ctrl+K`) returns quick results across students, courses, payments, and guardians.
- [x] **Diagnostics**: System self-test validates SQLite PRAGMA integrity, schema version 11, and generates sanitized support ZIP.

---

## 4. Packaging & Distribution Artifacts
- [ ] Build output directory is strictly `release/v2.0.0/`.
- [ ] Installer artifact generated: `release/v2.0.0/Edupilot-2.0.0-Setup.exe`.
- [ ] EduPilot 1.0.0 installer in `release/` remains untouched.
- [ ] SHA-256 checksum generated and stored in `release/v2.0.0/checksums.txt`.
