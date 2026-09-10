# EduPilot 2.0 Commercial — Quality Assurance & Acceptance Test Report

## 1. Executive Summary

| Property | Value |
| :--- | :--- |
| **Product** | EduPilot 2.0 Commercial |
| **Version** | 2.0.0 |
| **Target Operating System** | Windows 10 / Windows 11 (x64) |
| **Test Date** | 2026-09-09 |
| **QA Status** | **PASSED** |

This QA test report validates the complete functional integrity, commercial multi-school white-labeling capabilities, hardware peripheral integrations, and total version isolation of EduPilot 2.0 Commercial.

---

## 2. Test Execution Matrix

### Test Suite 1: Isolation & First Launch
| Test Case ID | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `TC-ISO-01` | First launch without prior configuration | Application detects uninitialized `school_settings`, redirects cleanly to `/setup`. | **PASS** |
| `TC-ISO-02` | AppData directory segregation | Files created exclusively in `%APPDATA%/Edupilot-2-Commercial/`. Zero writes to `%APPDATA%/Edupilot/`. | **PASS** |
| `TC-ISO-03` | Database file naming | Database created as `edupilot-v2.sqlite`. No collision with `edupilot.sqlite`. | **PASS** |
| `TC-ISO-04` | Setup wizard execution | Completes 6 steps, saves school logo, Arabic/French titles, and creates SuperAdmin account. | **PASS** |

### Test Suite 2: Student Card & QR Security
| Test Case ID | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `TC-CRD-01` | CR80 ID Card dimensions | Exact ISO/IEC 7810 ID-1 proportions (85.6mm x 54mm) rendered in CSS/SVG at 300 DPI. | **PASS** |
| `TC-CRD-02` | QR Code Payload Security | Decoded QR text matches `EDP2:<uuid>`. Zero personal plaintext data exposed. | **PASS** |
| `TC-CRD-03` | Card Flip & Preview | Front/Back 3D toggle functions smoothly with photo and metadata display. | **PASS** |
| `TC-CRD-04` | Multi-Format Printing | Direct print, Thermal 80mm ticket, and A4 8-card sheet print layouts preview correctly. | **PASS** |

### Test Suite 3: Multi-Billing & Financial Workflows
| Test Case ID | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `TC-BIL-01` | `monthly_subject` calculation | Correctly tallies fees across multiple enrolled subjects with sibling discounts. | **PASS** |
| `TC-BIL-02` | `monthly_student` flat fee | Fixed institutional tuition generated per student. | **PASS** |
| `TC-BIL-03` | `per_session` attendance credit | Attendance scan successfully decrements prepaid balance by session price. | **PASS** |
| `TC-BIL-04` | Receipt generation | Printable receipt generated with official numbering (`REC-2026-XXXX`). | **PASS** |

### Test Suite 4: Guardians, Documents & WhatsApp
| Test Case ID | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `TC-GRD-01` | Guardian linking | Links mother/father/tutor to student; shows primary contact badge. | **PASS** |
| `TC-DOC-01` | Document Vault upload | Native file dialog uploads PDF/JPG into protected local directory. | **PASS** |
| `TC-DOC-02` | Open document | Native Windows default application opens file via `shell.openPath`. | **PASS** |
| `TC-WHA-01` | WhatsApp dispatch | Formats domestic Algerian phone to `+213` and launches `wa.me` URL with interpolated text. | **PASS** |

### Test Suite 5: System Health, Import & Diagnostics
| Test Case ID | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `TC-IMP-01` | Excel / CSV import | Auto-detects column headers in Arabic/French, inserts batch, reports duplicates. | **PASS** |
| `TC-DIA-01` | SQLite PRAGMA integrity | Diagnostic suite returns `ok` for integrity, schema v11, and storage health. | **PASS** |
| `TC-DIA-02` | Support package export | Sanitized ZIP exported with schema metrics and zero sensitive student PII. | **PASS** |
| `TC-BAK-01` | Isolated backup | Creates atomic `.sqlite` snapshot in `%DOCUMENTS%/Edupilot-2-Backups/`. | **PASS** |

---

## 3. QA Sign-Off

EduPilot 2.0 Commercial (`v2.0.0`) satisfies all commercial requirements, enterprise security protocols, offline operational guarantees, and Windows platform isolation standards.
