# EduPilot 2.0 Commercial — WhatsApp Communication Integration

## 1. Local WhatsApp Dispatch Architecture

EduPilot 2.0 Commercial provides an integrated WhatsApp messaging engine designed to notify parents and students instantly with **zero API subscriptions, zero monthly fees, and zero cloud dependencies**.

### How It Works:
```
+---------------------------+       +---------------------------+       +---------------------------+
| EduPilot 2.0 UI           |       | Preload & Main Process    |       | System Default Browser /  |
| - Select Student/Guardian |------>| - Retrieve Template       |------>| WhatsApp Desktop / Web    |
| - Interpolate Variables   |       | - Clean Phone (+213...)   |       | - Opens:                  |
| - Click "Send WhatsApp"   |       | - shell.openExternal(url) |       |   wa.me/213XXXXXXXXX?text=|
+---------------------------+       +---------------------------+       +---------------------------+
```

1. Staff member triggers a notification (e.g., from Student Profile, Attendance Absentee list, or Payment Receipt screen).
2. The system interpolates dynamic parameters (`{{studentName}}`, `{{amount}}`, `{{sessionDate}}`).
3. The phone number is sanitized to international E.164 format (e.g., Algerian numbers starting with `05`, `06`, or `07` are automatically formatted with country code `+213`).
4. The application invokes Electron's `shell.openExternal()`, which immediately opens WhatsApp Desktop or WhatsApp Web with the conversation pre-loaded and message draft ready for a single click.

---

## 2. Default Notification Templates

The `whatsapp_templates` table is pre-seeded with 7 professional, trilingual templates:

| Template Code | Event Trigger | Description |
| :--- | :--- | :--- |
| `welcome` | New Student Enrollment | Welcome message confirming student registration |
| `payment_receipt` | Payment Collection | Detailed digital receipt with receipt number and balance |
| `payment_reminder` | Outstanding Dues | Polite reminder of upcoming or overdue monthly tuition |
| `attendance_absent` | Attendance Mark: Absent | Instant alert to guardian when student is absent |
| `attendance_late` | Attendance Mark: Late | Alert indicating time of arrival and tardiness |
| `exam_notice` | Scheduled Examination | Notification of upcoming evaluation date and syllabus |
| `general_notice` | Institutional Broadcast | Custom school circular or emergency closure announcement |

---

## 3. Template Variable Interpolation Matrix

Staff can customize template text in **Settings -> WhatsApp Templates**. The template engine replaces bracketed placeholders with live student and school data:

| Placeholder | Replaced With | Example |
| :--- | :--- | :--- |
| `{{schoolName}}` | School Arabic or French name | `المدرسة النموذجية` |
| `{{studentName}}` | Full name of the student | `أحمد بن علي` |
| `{{studentNumber}}` | Student ID code | `STD-2026-0042` |
| `{{guardianName}}` | Guardian full name | `السيد بن علي` |
| `{{courseName}}` | Enrolled subject or course | `الرياضيات - سنة 3 ثانوي` |
| `{{sessionDate}}` | Date of attendance/session | `2026-09-10` |
| `{{amount}}` | Payment or debt amount | `4,500` |
| `{{currency}}` | Institutional currency symbol | `د.ج` |
| `{{receiptNumber}}` | Official receipt ID | `REC-2026-0189` |
| `{{remainingBalance}}`| Unpaid debt or remaining credit | `0` |
| `{{schoolPhone}}` | School contact number | `0550 12 34 56` |

---

## 4. Guardian Phone Number Formatting & Fallback

When dispatching a message:
1. If the student has linked guardians in `student_guardians`, the system defaults to the **Primary Guardian** phone.
2. If no guardian is linked, the system falls back to the student's personal phone number.
3. Domestic Algerian numbers (e.g. `0555123456`, `0666123456`, `0777123456`) are automatically transformed into international format `213555123456`.
