# دليل إضافة وتخصيص أنواع المدارس في EduPilot DZ
## Guide: Adding & Customizing School Types in EduPilot DZ

---

### 1. نظرة عامة / Architecture Overview

تم تصميم **EduPilot DZ** كنظام متكامل ومرن لإدارة مختلف نماذج المؤسسات التعليمية والتدريبية الخاصة في الجزائر. كل مؤسسة تمتلك نوعاً أساسياً (`school_type`) يتم تخزينه محلياً في جدول `school_settings`.

الأنواع المدمجة افتراضياً تشمل:
1. **مدرسة لغات ومركز لغات أجنبية (`Language School`)**: يعتمد في الغالب على باقات الحصص (`SESSION_PACKAGE`) ونظام الدفع بالحصة (`PER_SESSION`).
2. **مركز دروس الدعم والتقوية المدرسية (`Tutoring Center`)**: يعتمد على الاشتراكات الشهرية (`MONTHLY`) أو باقات المراجعة المكثفة والامتحانات التجريبية (BAC / BEM).
3. **مدرسة خاصة نظامية (`Private School`)**: تشمل التعليم التحضيري، الابتدائي، المتوسط، والثانوي، وتعتمد نظام الأقساط الشهرية أو الثلاثية والملف العائلي الموحد.
4. **مدرسة قرآنية وزاوية تعليمية (`Quranic School`)**: تركز على حفظ القرآن، المتون، والعلوم الشرعية مع تتبع الحضور الدقيق.
5. **معهد تكوين مهني وتدريب معتمد (`Vocational Academy`)**: دورات تدريبية قصيرة وطويلة الأمد مع نظام الشهادات وبطاقات الحضور.
6. **أكاديمية فنون وموسيقى (`Music & Arts Academy`)**: ورشات تدريبية مرنة وحصص فردية/جماعية.

---

### 2. كيفية تغيير أو تحديد نوع المؤسسة من الواجهة (UI)

يمكن للمدير في أي وقت تحديد أو تغيير نوع المؤسسة مباشرة:
1. التوجه إلى قائمة **الإعدادات (Paramètres / Settings)**.
2. الدخول إلى تبويب **المؤسسة (Établissement / School Profile)**.
3. من القائمة المنسدلة **نوع المؤسسة والنشاط التعليمي (Type d'établissement & activité)**، اختر النوع المناسب لمؤسستك.
4. انقر فوق زر **حفظ الإعدادات (Enregistrer / Save)**.

---

### 3. خطوات إضافة نوع مؤسسة جديد في الكود المصدري (Developer Guide)

إذا أردت إضافة نوع جديد بالكامل (مثلاً: `Sports Academy` / أكاديمية رياضية، أو `Robotics & STEM Center` / مركز روبوتيك وذكاء اصطناعي):

#### الخطوة 1: تحديث واجهة الإعدادات والخيارات (`Settings.tsx` & `Setup.tsx`)
في ملف `src/renderer/pages/Settings.tsx`، أضف الخيار الجديد إلى قائمة `select`:
```tsx
<option value="Robotics Academy">
  {tr('أكاديمية الروبوتيك والذكاء الاصطناعي', 'Académie de Robotique & IA', 'Robotics & AI Academy')}
</option>
```

#### الخطوة 2: تحديث مخطط التحقق (`src/shared/schemas/index.ts`)
تأكد من أن حقل `schoolType` يقبل القيمة الجديدة أو يبقى كنص مرن:
```ts
export const UpdateSettingsSchema = z.object({
  // ...
  schoolType: z.string().max(100).optional().nullable(),
})
```

#### الخطوة 3: تخصيص نماذج الفوترة والتسعير (`Billing Policies`)
كل نوع مدرسة يتناسب مع نموذج دفع محدد:
- **إذا كانت مؤسستك مركز تدريب سريع**: اختر باقات الحصص (`SESSION_PACKAGE`).
- **إذا كانت مدرسة خاصة نظامية**: اختر الاشتراك الشهري (`MONTHLY`).
- **إذا كانت دروس دعم حرة**: اختر الدفع بالحصة (`PER_SESSION`).

يتم تحديد هذا النمط تلقائياً في دورات وأفواج المؤسسة من خلال إعدادات الفوترة (`Settings -> Billing Policies`).

#### الخطوة 4: تخصيص المستويات والمواد الدراسية
يمكنك الذهاب إلى قسم **المواد والأفواج (Cours & Groupes)** وتحديد المواد والمستويات الخاصة بنوع المدرسة (مثل: دورات لغات A1, A2, B1, B2 أو فروع علمية 1AS, 2AS, 3AS).

---

### 4. هيكل قاعدة البيانات (`Database Schema`)

العمود المسؤول في قاعدة البيانات المحلية SQLite:
```sql
ALTER TABLE school_settings ADD COLUMN school_type TEXT NOT NULL DEFAULT 'Language School';
```
ويتم استرجاعه وحفظه عبر خدمة الإعدادات:
- [settings.service.ts](file:///a:/Programation/EduPilot%20DZ/src/main/services/settings.service.ts)
- [schema.ts](file:///a:/Programation/EduPilot%20DZ/src/main/database/schema.ts)
