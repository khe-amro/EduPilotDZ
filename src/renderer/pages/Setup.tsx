import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2, Building2, User, Globe, Eye, EyeOff,
  Check, Upload, Sparkles, Sliders
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { switchLanguage, type SupportedLanguage } from '../i18n/i18n'

const STEPS = [
  { key: 'language', label: 'اللغة / Language' },
  { key: 'identity', label: 'هوية المؤسسة / Identity' },
  { key: 'academic', label: 'الإعدادات / Config' },
  { key: 'owner', label: 'حساب المسؤول / Owner' },
  { key: 'features', label: 'الميزات / Features' },
  { key: 'finish', label: 'التأكيد / Finish' },
] as const

const WILAYAS = [
  '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna',
  '06 - Béjaïa', '07 - Biskra', '08 - Béchar', '09 - Blida', '10 - Bouira',
  '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou',
  '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
  '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine',
  '26 - Médéa', '27 - Mostaganem', '28 - M\'Sila', '29 - Mascara', '30 - Ouargla',
  '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès',
  '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
  '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma',
  '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane', '49 - Timimoun', '50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal', '52 - Béni Abbès', '53 - In Salah', '54 - In Guezzam', '55 - Touggourt',
  '56 - Djanet', '57 - El M\'Ghair', '58 - El Menia'
]

export default function Setup() {
  const { t } = useTranslation()
  const { completeSetup } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const currentYear = new Date().getFullYear()
  const [form, setForm] = useState({
    // Step 0: Language
    preferredLanguage: 'ar' as SupportedLanguage,
    // Step 1: School Identity
    schoolNameAr: '',
    schoolNameFr: '',
    schoolNameEn: '',
    wilaya: '16 - Alger',
    address: '',
    phone: '',
    email: '',
    logoPath: '',
    logoPreview: '',
    // Step 2: Academic & Config
    academicYear: `${currentYear}-${currentYear + 1}`,
    currency: 'DZD',
    lateThresholdMinutes: '10',
    receiptWidth: '80mm',
    // Step 3: Owner Account
    adminFullName: '',
    adminUsername: 'admin',
    adminPassword: '',
    confirmPassword: '',
    // Step 4: Features
    enableCards: true,
    enableWhatsApp: true,
    enablePackages: true,
    enableReceiptPrinting: true,
  })

  const setField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectLogo = async () => {
    try {
      const res = await window.schoolApp?.media?.selectImage?.('admin', 'school_logo')
      if (res && res.success && res.data?.path) {
        setField('logoPath', res.data.path)
        const urlRes = await window.schoolApp.media.getImageUrl(res.data.path)
        if (urlRes.success && urlRes.data?.url) {
          setField('logoPreview', urlRes.data.url)
        }
      }
    } catch (e) {
      console.warn('Logo selection error:', e)
    }
  }

  const nextStep = () => {
    setError('')
    if (step === 1) {
      if (!form.schoolNameAr.trim()) {
        setError('يرجى إدخال اسم المؤسسة بالعربية (Nom en Arabe requis)')
        return
      }
    } else if (step === 3) {
      if (!form.adminFullName.trim()) {
        setError('يرجى إدخال الاسم الكامل لمدير النظام')
        return
      }
      if (!form.adminUsername.trim()) {
        setError('يرجى تحديد اسم المستخدم للمدير')
        return
      }
      if (!form.adminPassword || form.adminPassword.length < 4) {
        setError('كلمة المرور يجب ألا تقل عن 4 خانات')
        return
      }
      if (form.adminPassword !== form.confirmPassword) {
        setError('كلمة المرور غير متطابقة')
        return
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const prevStep = () => {
    setError('')
    setStep((s) => Math.max(0, s - 1))
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const cleanSchoolNameAr = form.schoolNameAr.trim() || 'المؤسسة النموذجية'
      const cleanSchoolNameFr = form.schoolNameFr.trim() || cleanSchoolNameAr

      const result = await completeSetup({
        schoolNameAr: cleanSchoolNameAr,
        schoolNameFr: cleanSchoolNameFr,
        schoolNameEn: form.schoolNameEn.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: `${form.wilaya}${form.address ? ` - ${form.address}` : ''}`.trim() || undefined,
        academicYear: form.academicYear,
        adminFullName: form.adminFullName.trim() || 'مدير المؤسسة',
        adminUsername: form.adminUsername.trim() || 'admin',
        adminPassword: form.adminPassword || 'admin123',
        preferredLanguage: form.preferredLanguage,
        logoPath: form.logoPath || undefined,
      })

      if (!result.success) {
        setError(result.error ?? 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة ثانية')
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ داخلي، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors'
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8 font-sans">
      <div className="w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-[#2563EB] flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">{t('setup.title')}</h1>
          <p className="text-slate-500 text-sm">{t('setup.subtitle')}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6 gap-1.5 sm:gap-2">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  idx < step
                    ? 'bg-success text-white'
                    : idx === step
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
                title={s.label}
              >
                {idx < step ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-6 sm:w-10 h-0.5 transition-colors ${
                    idx < step ? 'bg-success' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs">
          {/* STEP 0: Language & Preferences */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Globe className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-semibold text-[#0F172A] text-sm">{t('setup.step3')}</h2>
              </div>

              <div>
                <label className={labelCls}>{t('setup.preferredLanguage')}</label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['ar', 'fr', 'en'] as const).map((lang) => {
                    const labels = { ar: 'العربية', fr: 'Français', en: 'English' }
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setField('preferredLanguage', lang)
                          switchLanguage(lang)
                        }}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors cursor-pointer ${
                          form.preferredLanguage === lang
                            ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                            : 'border-border text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {labels[lang]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">✓ {t('common.localDatabase')}</p>
                <p className="text-xs opacity-80">{t('app.offline')}</p>
              </div>
            </div>
          )}

          {/* STEP 1: School Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-semibold text-[#0F172A] text-sm">{t('setup.step1')}</h2>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.logoPreview ? (
                    <img src={form.logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 mb-1">شعار المؤسسة</p>
                  <button
                    type="button"
                    onClick={handleSelectLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <Upload size={12} />
                    {form.logoPath ? 'تغيير الشعار' : 'اختيار شعار'}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('setup.schoolNameAr')} *</label>
                <input
                  className={inputCls}
                  dir="rtl"
                  placeholder="مدرسة النخبة للغات والدعم المدرسي"
                  value={form.schoolNameAr}
                  onChange={(e) => setField('schoolNameAr', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>{t('setup.schoolNameFr')}</label>
                <input
                  className={inputCls}
                  placeholder="École d'Élite & Centre Pédagogique"
                  value={form.schoolNameFr}
                  onChange={(e) => setField('schoolNameFr', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>الولاية (Wilaya)</label>
                  <select
                    className={inputCls}
                    value={form.wilaya}
                    onChange={(e) => setField('wilaya', e.target.value)}
                  >
                    {WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('setup.schoolPhone')}</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    placeholder="0550 123 456"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('setup.schoolAddress')}</label>
                <input
                  className={inputCls}
                  placeholder="شارع الاستقلال، وسط المدينة"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Academic & Billing Config */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-semibold text-[#0F172A] text-sm">الإعدادات الأكاديمية والطباعة</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('setup.academicYear')}</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    placeholder={`${currentYear}-${currentYear + 1}`}
                    value={form.academicYear}
                    onChange={(e) => setField('academicYear', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>العملة الرئيسية</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    value={form.currency}
                    onChange={(e) => setField('currency', e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>طابعة التذاكر والوصولات</label>
                <select
                  className={inputCls}
                  value={form.receiptWidth}
                  onChange={(e) => setField('receiptWidth', e.target.value)}
                >
                  <option value="80mm">80mm (حراري قياسي - Thermal POS)</option>
                  <option value="58mm">58mm (حراري صغير - Mini POS)</option>
                  <option value="A4">A4 (طابعة مكتبية عادية)</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs text-blue-800 leading-relaxed">
                💡 <span className="font-semibold">نماذج الفوترة المدعومة:</span> اشتراك شهري، دفع بالحصة، باقات حصص مسبقة الدفع. يمكن تخصيصها لكل مادة وفوج لاحقاً.
              </div>
            </div>
          )}

          {/* STEP 3: Owner Account */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-semibold text-[#0F172A] text-sm">{t('setup.step2')}</h2>
              </div>

              <div>
                <label className={labelCls}>{t('setup.adminName')} *</label>
                <input
                  className={inputCls}
                  placeholder="محمد بن علي"
                  value={form.adminFullName}
                  onChange={(e) => setField('adminFullName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>{t('setup.adminUsername')} *</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  placeholder="admin"
                  value={form.adminUsername}
                  onChange={(e) => setField('adminUsername', e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('setup.adminPassword')} *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`${inputCls} pe-10`}
                      dir="ltr"
                      value={form.adminPassword}
                      onChange={(e) => setField('adminPassword', e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 inset-e-0 px-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('auth.confirmPassword')} *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`${inputCls} pe-10`}
                      dir="ltr"
                      value={form.confirmPassword}
                      onChange={(e) => setField('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 inset-e-0 px-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Features */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-semibold text-[#0F172A] text-sm">ميزات النظام المتاحة</h2>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'enableCards', label: 'بطاقات الطلاب الذكية (QR Cards)', desc: 'توليد وطباعة بطاقات بلاستيكية CR80 أو تذاكر حرارية مع رمز مشفر' },
                  { key: 'enableWhatsApp', label: 'المراسلة عبر واتساب (WhatsApp Direct)', desc: 'إشعار أولياء الأمور بالغيابات والوصولات والتذكير بالدفع' },
                  { key: 'enablePackages', label: 'نماذج الفوترة المتقدمة (Billing Models)', desc: 'دعم باقات الحصص المنتهية بالعدد ونظام الدفع بالحصة المباشر' },
                  { key: 'enableReceiptPrinting', label: 'طباعة وصولات القبض المباشرة', desc: 'تجهيز وصولات الدفع الحرارية فور تسجيل العمليات النقدية' },
                ].map((f) => (
                  <label
                    key={f.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={(form as any)[f.key]}
                      onChange={(e) => setField(f.key, e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#2563EB] rounded border-slate-300 focus:ring-[#2563EB]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">{f.label}</p>
                      <p className="text-[11px] text-slate-500">{f.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-[#0F172A] text-sm">مراجعة البيانات وإنهاء التثبيت</h2>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">المؤسسة:</span>
                  <span className="font-bold text-slate-800">{form.schoolNameAr}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">الولاية والمقر:</span>
                  <span className="font-semibold text-slate-800">{form.wilaya} {form.address ? `• ${form.address}` : ''}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">المسؤول:</span>
                  <span className="font-bold text-slate-800">{form.adminFullName} (@{form.adminUsername})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">السنة والعملة:</span>
                  <span className="font-semibold text-slate-800">{form.academicYear} • {form.currency}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>النظام جاهز لبدء العمل والترحيب بالطلاب في نسخته التجارية المستقلة.</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
            {step > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                ← {t('setup.back')}
              </button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-xs"
              >
                {t('setup.next')} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="bg-success text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15803D] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? t('setup.settingUp') : t('setup.completeSetup')}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Edupilot Commercial v2.0.0 • Architecture Locale Hors-Ligne
        </p>
      </div>
    </div>
  )
}
