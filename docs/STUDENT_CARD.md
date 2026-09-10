# EduPilot 2.0 Commercial — Student ID Card & Barcode Specification

## 1. Plastic CR80 Card Specification

EduPilot 2.0 Commercial features an integrated, high-resolution ID card generator conforming strictly to the international ISO/IEC 7810 ID-1 standard (CR80 format).

### Physical Dimensions & Print Parameters
- **Standard**: ISO/IEC 7810 ID-1 (CR80 Standard Plastic Card)
- **Physical Dimensions**: `85.60 mm x 53.98 mm` (3.370 in x 2.125 in)
- **Corner Radius**: `3.18 mm` (1/8 in)
- **Resolution**: 300 DPI (High-definition vector/raster composition)
- **Pixel Grid (at 300 DPI)**: `1011 px x 638 px`

```
+-----------------------------------------------------------------------+
|  [Logo] INSTITUTION NAME HERE                             [ACADEMIC]  |
|  -------------------------------------------------------------------  |
|  +------------+                                                       |
|  |            |  STUDENT FULL NAME (ARABIC / LATIN)                   |
|  |  Student   |  Registration ID: STD-2026-0842                       |
|  |   Photo    |  Birthdate: 14/03/2008       Blood Group: O+          |
|  |            |  Grade / Course: Bac Sciences Expérimentales          |
|  +------------+                                                       |
|                                                     +---------------+ |
|  [Emergency / School Phone]                         | QR:           | |
|  [Authorized Signature]                             | EDP2:<uuid>   | |
|                                                     +---------------+ |
+-----------------------------------------------------------------------+
```

### Visual Styling & Premium Aesthetics
- **Background**: Deep executive navy (`#0A192F` to `#1E3A8A`) with subtle geometric circular watermark patterns.
- **Accents**: Warm luxury gold (`#F59E0B` / `#D97706`) and crisp clean white borders.
- **Typography**: Trilingual typography using modern Cairo for Arabic and Inter for French/English.
- **Photo**: High-contrast portrait frame with subtle drop shadow and white protective border.

---

## 2. Card QR Code Security Token Specification

The QR code printed on the student card is engineered strictly for **fast scanning and data protection**:

### CRITICAL SECURITY RULE:
> **The QR code encodes EXCLUSIVELY an opaque, unique identifier string prefixed with `EDP2:`. It NEVER contains plaintext student names, phone numbers, birthdates, or personal identifiers.**

```
Format: EDP2:<cardUuid>
Example: EDP2:a7b8c9d0-1234-5678-9abc-def012345678
```

### Verification & Resolution Flow:
1. When scanned by any standard 2D barcode imager, USB scanner, or camera in attendance mode:
2. The scanner inputs `EDP2:<uuid>`.
3. The application strips the `EDP2:` prefix and queries the `student_cards` table:
   ```sql
   SELECT student_id, status FROM student_cards WHERE card_uuid = ?;
   ```
4. If the card is `active`, the student profile is retrieved and attendance is marked.
5. If the card is `disabled` or `lost`, the scanner sounds an alert and denies entry.
6. If a plain number or generic QR is scanned, the scanner rejects it immediately as invalid.

---

## 3. Print Layout Formats

EduPilot 2.0 Commercial supports three distinct output print modes:

1. **Direct CR80 Plastic Card Printer**:
   - Single-card output spooled directly to plastic card printers (e.g., Evolis Zenius/Primacy, Zebra ZC300, Fargo HDP5000) with front and back layout.

2. **A4 Sheet Batch Printing (8 Cards Per Page)**:
   - Formatted for standard desktop color printers.
   - Grid layout: 2 columns x 4 rows with cutting registration marks and 2mm bleed margins.
   - Allows printing 8 student badges on heavy cardstock or PVC-laminate paper in a single pass.

3. **Thermal Receipt Paper Badge (80mm Ticket)**:
   - Fast, low-cost temporary badge printed on standard 80mm thermal receipt paper (Xprinter, Epson TM-T20).
   - Contains school header, student name, registration number, and the high-contrast `EDP2:` QR code.
