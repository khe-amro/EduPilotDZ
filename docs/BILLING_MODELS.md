# EduPilot 2.0 Commercial — Multi-Billing Models Specification

## 1. Overview of Billing Paradigms

Private schools and educational institutions employ diverse financial models depending on their pedagogical structure. EduPilot 2.0 Commercial natively supports **4 distinct billing models**, configurable globally in Settings or overridden at the individual course or enrollment level.

```
                           +----------------------------------------+
                           |  Billing Models Supported in v2.0.0    |
                           +----------------------------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
+--------------------+       +--------------------+       +--------------------+
| 1. Monthly Subject |       | 2. Monthly Student |       | 3. Per Session     |
| (Tutoring Centers) |       | (Private Schools)  |       | (Pay-as-you-go)    |
+--------------------+       +--------------------+       +--------------------+
          |
          +----------------------------+
                                       v
                             +--------------------+
                             | 4. Per Course      |
                             | (Crash Courses)    |
                             +--------------------+
```

---

## 2. Model Breakdown & Invoicing Logic

### Model 1: Monthly Per Subject (`monthly_subject`)
* **Target Institution**: Algerian support classes, tutoring centers, exam prep academies (BAC / BEM).
* **Concept**: The student pays a recurring monthly fee for each distinct course or subject in which they are enrolled (e.g., Mathematics = 3,000 DZD/month, Physics = 2,500 DZD/month).
* **Billing Cycle**: Automatically calculates fees based on the active calendar month (e.g., `2026-09`).
* **Enrollment Fee**: An optional one-time annual registration/insurance fee can be charged upon initial enrollment.
* **Discount System**: Supports sibling discounts (`siblingDiscountPercent`) and multi-course bundle discounts.

### Model 2: Monthly Flat Student Tuition (`monthly_student`)
* **Target Institution**: Accredited K-12 private schools (Primary, Middle, High School).
* **Concept**: A unified monthly institutional tuition fee covering all academic subjects in the student's grade level.
* **Billing Cycle**: 10 or 12 fixed monthly installments per academic year.
* **Add-ons**: Supports supplemental fees such as school transportation, cafeteria/catering, and extracurricular clubs.

### Model 3: Per-Session Debit Model (`per_session`)
* **Target Institution**: Flexible tutoring centers, language clubs, music/art workshops, sports academies.
* **Concept**: Students purchase a prepaid balance (credit pool) or pay per attendance scan.
* **Attendance Billing Trigger**:
  1. Student presents their CR80 ID Card or QR ticket at the attendance station.
  2. The scanner decodes the card identifier `EDP2:<uuid>`.
  3. The system verifies the student's credit balance:
     - If `balance >= sessionPrice`: The session fee is deducted immediately, attendance is marked `present`, and remaining sessions/credits are shown on the screen.
     - If `balance < sessionPrice`: An alert displays "Insufficient Credits", attendance is logged with a debt flag, and a guardian WhatsApp alert can be dispatched.

### Model 4: Per Course Lump-Sum (`per_course`)
* **Target Institution**: Vocational training institutes, corporate workshops, crash revision packages.
* **Concept**: A fixed total package price for a complete course spanning a set duration (e.g., 3-month English speaking course = 25,000 DZD).
* **Payment Plans**: Supports full payment upon enrollment or split installments (e.g., 50% deposit + 50% midpoint).

---

## 3. Database Schema Support

The schema in `edupilot-v2.sqlite` encapsulates multi-billing parameters across three tables:

### `courses` table:
- `billingModel`: `'monthly_subject' | 'monthly_student' | 'per_session' | 'per_course'`
- `price`: Default pricing amount
- `sessionPrice`: Unit price when billing per session

### `enrollments` table:
- `billingModel`: Override per enrollment
- `customPrice`: Custom price agreement (scholarship, negotiated discount)
- `creditBalance`: Current prepaid credit balance for `per_session` mode
- `discountType`: `'none' | 'percent' | 'fixed'`
- `discountValue`: Numerical value of the discount

### `payments` table:
- `amount`: Net amount paid
- `paymentMethod`: `'cash' | 'check' | 'bank_transfer' | 'baridimob'`
- `billingPeriod`: Year/Month reference (e.g., `2026-09`) or `'full'`
- `receivedByName`: Name of staff member who received the payment
