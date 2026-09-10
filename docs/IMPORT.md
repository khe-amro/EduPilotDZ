# EduPilot 2.0 Commercial — Student Data Import Specification

## 1. Overview & Supported Formats

To facilitate rapid migration from legacy spreadsheets, Microsoft Excel files, or previous school systems, EduPilot 2.0 Commercial includes a high-speed data import engine (`import.service.ts`).

### Supported File Types:
- **Microsoft Excel**: `.xlsx` and `.xls` (parsed using `xlsx` engine)
- **Comma-Separated Values**: `.csv` (UTF-8, UTF-16, with comma, semicolon, or tab delimiters)

---

## 2. Three-Step Import Workflow

The import modal guides the administrator through 3 stages:

```
+-----------------------------------------------------------------------+
|  Step 1: Upload & File Inspection                                     |
|    - Staff selects file via native file picker dialog                 |
|    - System reads headers and first 5 sample rows                     |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  Step 2: Automatic Header Detection & Column Mapping                  |
|    - System scans header names against known dictionary synonyms      |
|    - User reviews and confirms mapping dropdowns                      |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|  Step 3: Validation, Duplicate Check & Atomic Database Commit         |
|    - Validates mandatory fields (first name, last name, phone)        |
|    - Checks for duplicates against existing student database          |
|    - Inserts records in a single transactional batch                  |
|    - Generates downloadable import error & success log                |
+-----------------------------------------------------------------------+
```

---

## 3. Intelligent Synonym Matching Engine

The import engine recognizes Arabic, French, and English column headers automatically:

| Target Database Field | Recognized Header Aliases |
| :--- | :--- |
| **First Name** | `firstName`, `first_name`, `prenom`, `prénom`, `الاسم`, `اسم الطالب` |
| **Last Name** | `lastName`, `last_name`, `nom`, `اللقب`, `لقب الطالب`, `العائلة` |
| **Student Number** | `studentNumber`, `matricule`, `id`, `code`, `رقم التسجيل`, `رقم التلميذ` |
| **Date of Birth** | `birthDate`, `date_naissance`, `dob`, `تاريخ الميلاد`, `تاريخ الازدياد` |
| **Gender** | `gender`, `sexe`, `الجنس`, `النوع` |
| **Student Phone** | `phone`, `telephone`, `mobile`, `tel`, `الهاتف`, `رقم الهاتف` |
| **Guardian Phone** | `guardianPhone`, `parentPhone`, `tel_parent`, `هاتف الولي`, `هاتف الأب` |
| **Guardian Name** | `guardianName`, `nom_parent`, `parent`, `اسم الولي`, `ولي الأمر` |
| **Address** | `address`, `adresse`, `العنوان`, `مكان السكن` |
| **Grade / Level** | `grade`, `level`, `niveau`, `المستوى`, `القسم`, `الصف` |

---

## 4. Transactional Safety & Error Handling

- **Single Transaction**: The import operation executes inside an SQLite transaction (`db.transaction()`). If a catastrophic database fault occurs, the entire batch rolls back, preventing partial or corrupted imports.
- **Duplicate Prevention**: If a row matches an existing student (by student number or identical full name and birthdate), the administrator can choose to **Skip** the duplicate or **Update** the existing record.
- **Detailed Summary**: Upon completion, the dialog presents total rows processed, successfully imported records, skipped duplicates, and an itemized table of invalid rows with specific error reasons.
