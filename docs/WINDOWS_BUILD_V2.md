# EduPilot 2.0 Commercial — Windows Build & Packaging Guide

## 1. Prerequisites for Building on Windows

Building EduPilot 2.0 Commercial from source requires a standard Node.js and C++ native compilation environment:

1. **Node.js**: Version 20 LTS (or higher).
2. **Package Manager**: `pnpm` (version 9+).
3. **C/C++ Build Tools**:
   - Visual Studio 2022 Build Tools (with "Desktop development with C++" workload installed) for compiling `better-sqlite3` native binaries.
   - Python 3.10+ (required by `node-gyp`).

---

## 2. Project Build Scripts

In `package.json`, the following scripts manage the build and distribution pipeline:

```bash
# 1. Typecheck the entire TypeScript codebase
pnpm typecheck

# 2. Build Renderer (Vite) and Electron Main/Preload
pnpm build

# 3. Package Windows Installer (electron-builder targeting release/v2.0.0/)
pnpm dist:win
```

---

## 3. Electron-Builder Configuration

The installer configuration in `package.json` (or `electron-builder.yml`) enforces the commercial v2 release specifications:

```json
{
  "appId": "com.edupilot.commercial.v2",
  "productName": "Edupilot 2.0 Commercial",
  "executableName": "Edupilot2",
  "directories": {
    "output": "release/v2.0.0"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "shortcutName": "Edupilot 2.0 Commercial",
    "artifactName": "Edupilot-${version}-Setup.${ext}"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "resources/icon.ico"
  }
}
```

---

## 4. Verification of the Built Installer

Upon successful completion of `pnpm dist:win`:
1. The installer binary will be generated at:
   `release/v2.0.0/Edupilot-2.0.0-Setup.exe`
2. Generate SHA-256 checksum:
   ```powershell
   Get-FileHash "release/v2.0.0/Edupilot-2.0.0-Setup.exe" -Algorithm SHA256 > "release/v2.0.0/checksums.txt"
   ```
3. Verify that existing EduPilot 1.0.0 build artifacts under `release/` (`Edupilot Setup 1.0.0.exe`) remain untouched.
