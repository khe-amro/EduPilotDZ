# EduPilot 2.0 Commercial — Product Configuration & White-Labeling Guide

## 1. First-Launch Onboarding Wizard (`/setup`)

When EduPilot 2.0 Commercial boots for the first time, it automatically verifies whether institutional setup has been executed. If `school_settings` is uninitialized or requires configuration, the application routes directly to `/setup`.

The Setup Wizard is a guided 6-step workflow designed to take less than 3 minutes:

```
+-----------+    +-----------+    +-----------+    +-----------+    +-----------+    +-----------+
|  Step 1   |--->|  Step 2   |--->|  Step 3   |--->|  Step 4   |--->|  Step 5   |--->|  Step 6   |
| School ID |    | Branding  |    | Academic  |    | Billing   |    | SuperAdmin|    | Summary   |
+-----------+    +-----------+    +-----------+    +-----------+    +-----------+    +-----------+
```

### Step 1: Institutional Identification
- **School Legal Name**: Official name for government declarations, receipts, and certificates.
- **Trilingual Display Names**: Arabic (`schoolNameAr`), French (`schoolNameFr`), and English (`schoolNameEn`).
- **School Type**: General Private School, Tutoring Academy / Center, Language Institute, or Vocational Academy.
- **Contact Details**: Official telephone number, WhatsApp business phone, support email, and institutional address.

### Step 2: Branding & Visual Customization
- **School Logo Upload**: Native file selector accepting `.png`, `.jpg`, `.jpeg`, `.svg`. The file is saved directly into `%APPDATA%/Edupilot-2-Commercial/uploads/logos/` and referenced locally.
- **Sub-Header Slogan**: Arabic or French subtitle displayed on receipts, certificates, and student cards.
- **Primary Brand Color**: Hex color code (defaults to institutional navy `#1E3A8A` or cobalt `#2563EB`). All printable receipts and badges adapt to this accent.

### Step 3: Academic & Currency Settings
- **Academic Year**: Pre-populated with current standard academic session (e.g., `2025/2026`).
- **Currency Symbol**: Standard national currency symbol (defaults to Algerian Dinar `د.ج / DZD`).
- **Receipt & Student Prefixes**: Custom numbering prefixes (e.g., `EP-REC-`, `STD-`).

### Step 4: Billing Policy Selection
Selection of the default institution-wide billing model:
1. `monthly_subject` (Standard Algerian tutoring model: monthly payment per enrolled subject)
2. `monthly_student` (Private school flat tuition model: flat monthly fee for all subjects)
3. `per_session` (Credit deduction model: balance deducted upon attendance scan)
4. `per_course` (Lump-sum training package model: one-time or installment payment)

### Step 5: SuperAdmin Account Initialization
- Full Name, Username, Secure Password (hashed with PBKDF2), and preferred interface language (`ar`, `fr`, or `en`).

### Step 6: Verification & Database Commit
- Displays a final summary card.
- Upon clicking "Complete Setup", updates `school_settings` (row id = 1), seeds default WhatsApp templates, creates the primary administrator account, and transitions to the Dashboard.

---

## 2. Configuration Schema (`school_settings`)

Institutional configurations are stored in the singleton row (`id = 1`) of the `school_settings` table:

| Column Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `1` | Primary key singleton |
| `schoolLegalName` | `TEXT` | `NULL` | Legal institutional entity name |
| `schoolNameAr` | `TEXT` | `'المدرسة النموذجية'` | Primary Arabic name |
| `schoolNameFr` | `TEXT` | `'École Modèle'` | French translation |
| `schoolNameEn` | `TEXT` | `'Model School'` | English translation |
| `schoolLogoPath` | `TEXT` | `NULL` | Relative or absolute path to logo image |
| `headerSubtitle` | `TEXT` | `NULL` | Slogan / sub-header on documents |
| `phone` | `TEXT` | `NULL` | Primary contact phone |
| `whatsappPhone` | `TEXT` | `NULL` | Official institutional WhatsApp number |
| `email` | `TEXT` | `NULL` | Contact email |
| `address` | `TEXT` | `NULL` | Physical address |
| `academicYear` | `TEXT` | `'2025/2026'` | Active academic year |
| `currency` | `TEXT` | `'د.ج'` | Currency symbol |
| `studentNumberPrefix` | `TEXT` | `'STD-'` | Student registration code prefix |
| `receiptPrefix` | `TEXT` | `'REC-'` | Payment receipt code prefix |
| `defaultLanguage` | `TEXT` | `'ar'` | Interface language fallback (`ar`, `fr`, `en`) |
| `primaryAccentColor`| `TEXT` | `'#2563EB'` | Primary brand color |
| `defaultBillingModel`| `TEXT` | `'monthly_subject'`| Global billing model default |
| `studentCardsEnabled`| `INTEGER` | `1` | Enable/disable ID card module |
| `whatsappEnabled` | `INTEGER` | `1` | Enable/disable WhatsApp dispatch |
| `documentsEnabled` | `INTEGER` | `1` | Enable/disable Student Document Vault |
| `backupDirectory` | `TEXT` | `NULL` | Custom backup directory override |
| `automaticBackupEnabled`| `INTEGER`| `1` | Automatic daily backup on close/open |
| `backupsToRetain` | `INTEGER` | `10` | Rotation retention limit |
| `receiptPrinterName`| `TEXT` | `NULL` | Assigned default Windows ESC/POS printer |
| `receiptPaperWidth` | `TEXT` | `'80mm'` | Thermal paper width (`80mm` or `58mm`) |

---

## 3. Post-Setup Customization

All parameters configured during initial setup can be updated at any time by navigating to:
**Settings -> School Profile (`/settings?tab=school`)**

Modifications take effect immediately across all modules, receipt print previews, and student cards without requiring an application restart.
