import React, { useState, useEffect } from 'react'
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, RefreshCw, Layers, ShieldCheck
} from 'lucide-react'

interface StudentImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: () => void
}

export default function StudentImportModal({ isOpen, onClose, onImportComplete }: StudentImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [previewData, setPreviewData] = useState<{
    fileName: string
    headers: string[]
    sampleRows: Record<string, string>[]
    totalRowsEstimate: number
    filePath: string
  } | null>(null)

  const [mapping, setMapping] = useState<{
    firstName: string
    lastName: string
    firstNameFr: string
    lastNameFr: string
    fullName: string
    phone: string
    guardianName: string
    guardianPhone: string
    guardianRelationship: string
    groupName: string
    gender: string
    dateOfBirth: string
    address: string
  }>({
    firstName: '',
    lastName: '',
    firstNameFr: '',
    lastNameFr: '',
    fullName: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: '',
    groupName: '',
    gender: '',
    dateOfBirth: '',
    address: '',
  })

  const [options, setOptions] = useState({
    skipHeader: true,
    defaultGender: 'male' as 'male' | 'female',
    createCards: true,
    autoLinkGroups: true,
    skipDuplicates: true,
  })

  const [result, setResult] = useState<{
    importedCount: number
    skippedCount: number
    duplicateCount: number
    errorCount: number
    errors: Array<{ row: number; error: string }>
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setPreviewData(null)
      setError(null)
      setResult(null)
    }
  }, [isOpen])

  const handleSelectFile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.schoolApp?.import?.preview?.()
      if (res && res.success && res.data) {
        setPreviewData(res.data)
        autoDetectMapping(res.data.headers)
        setStep(2)
      } else if (res && !res.success) {
        setError(res.error || 'Failed to read spreadsheet file.')
      }
    } catch (err: any) {
      setError(err?.message || 'Error parsing import file.')
    } finally {
      setLoading(false)
    }
  }

  const autoDetectMapping = (headers: string[]) => {
    const newMap = { ...mapping }
    headers.forEach((h) => {
      const norm = h.toLowerCase().trim()
      if (norm.includes('tuteur') || norm.includes('parent') || norm.includes('guardian') || norm.includes('ولي')) {
        if (norm.includes('tel') || norm.includes('tél') || norm.includes('phone') || norm.includes('هاتف')) {
          newMap.guardianPhone = h
        } else if (norm.includes('relation') || norm.includes('lien') || norm.includes('قرابة') || norm.includes('صلة')) {
          newMap.guardianRelationship = h
        } else {
          newMap.guardianName = h
        }
      } else if (norm.includes('relation') || norm.includes('lien') || norm.includes('قرابة') || norm.includes('صلة')) {
        newMap.guardianRelationship = h
      } else if (norm.includes('fr') || norm.includes('فرنسي') || norm.includes('latin')) {
        if (norm.includes('prenom') || norm.includes('prénom') || norm.includes('اسم')) {
          newMap.firstNameFr = h
        } else if (norm.includes('nom') || norm.includes('لقب')) {
          newMap.lastNameFr = h
        }
      } else if (norm === 'الاسم' || norm === 'prenom' || norm === 'prénom' || norm === 'first_name') {
        newMap.firstName = h
      } else if (norm === 'اللقب' || norm === 'nom' || norm === 'last_name') {
        newMap.lastName = h
      } else if (!newMap.firstName && (norm.includes('prenom') || norm.includes('prénom') || (norm.includes('اسم') && !norm.includes('كامل') && !norm.includes('ولي')))) {
        newMap.firstName = h
      } else if (!newMap.lastName && (norm.includes('nom') || norm.includes('لقب') || norm.includes('نسب'))) {
        newMap.lastName = h
      } else if (norm.includes('eleve') || norm.includes('élève') || norm.includes('student') || norm.includes('طالب') || norm.includes('تلميذ') || norm.includes('كامل')) {
        newMap.fullName = h
      } else if (norm.includes('tel') || norm.includes('tél') || norm.includes('phone') || norm.includes('هاتف')) {
        if (!newMap.phone) newMap.phone = h
      } else if (norm.includes('classe') || norm.includes('groupe') || norm.includes('group') || norm.includes('فوج')) {
        newMap.groupName = h
      } else if (norm.includes('sexe') || norm.includes('gender') || norm.includes('جنس')) {
        newMap.gender = h
      } else if (norm.includes('naissance') || norm.includes('birth') || norm.includes('ميلاد')) {
        newMap.dateOfBirth = h
      } else if (norm.includes('adresse') || norm.includes('address') || norm.includes('عنوان')) {
        newMap.address = h
      }
    })
    setMapping(newMap)
  }

  const handleExecuteImport = async () => {
    if (!previewData) return
    setLoading(true)
    setError(null)
    try {
      const res = await window.schoolApp?.import?.execute?.(previewData.filePath, mapping, options)
      if (res && res.success && res.data) {
        setResult(res.data)
        setStep(3)
        onImportComplete?.()
      } else {
        setError((res as any)?.error || 'Import transaction failed.')
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing import.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">استيراد الطلاب من ملف Excel / CSV</h3>
              <p className="text-[11px] text-slate-500">Student Batch Importer & Data Mapping</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select File */}
          {step === 1 && (
            <div className="py-8 text-center space-y-4">
              <div
                onClick={handleSelectFile}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-3xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">انقر لاختيار ملف Excel (.xlsx) أو CSV</p>
                  <p className="text-xs text-slate-400 mt-1">يدعم ملفات جداول البيانات العربية والفرنسية والإنجليزية</p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {loading ? 'جاري قراءة الملف...' : 'تصفح جهاز الكمبيوتر'}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 text-start flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>معاملة آمنة (Transactional):</strong> تتم عملية الاستيراد داخل معاملة SQLite ذرية واحدة. إذا حدث خطأ في أي سطر، يتم التراجع عن التغييرات لحماية سلامة قاعدة البيانات.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping & Options */}
          {step === 2 && previewData && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">{previewData.fileName}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">~{previewData.totalRowsEstimate} أسطر بيانات</span>
              </div>

              {/* Column Mapping Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">مطابقة الأعمدة (Column Mapping):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">الاسم الأول (First Name):</label>
                    <select
                      value={mapping.firstName}
                      onChange={(e) => setMapping({ ...mapping, firstName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري أو مدمج مع اللقب --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">اللقب (Last Name) / الاسم الكامل *:</label>
                    <select
                      value={mapping.lastName || mapping.fullName}
                      onChange={(e) => setMapping({ ...mapping, lastName: e.target.value, fullName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-blue-900"
                    >
                      <option value="">-- اختر عمود الاسم --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">الهاتف (Phone):</label>
                    <select
                      value={mapping.phone}
                      onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">اسم ولي الأمر (Guardian Name):</label>
                    <select
                      value={mapping.guardianName}
                      onChange={(e) => setMapping({ ...mapping, guardianName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">هاتف ولي الأمر (Guardian Phone):</label>
                    <select
                      value={mapping.guardianPhone}
                      onChange={(e) => setMapping({ ...mapping, guardianPhone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">صلة القرابة (Relationship):</label>
                    <select
                      value={mapping.guardianRelationship}
                      onChange={(e) => setMapping({ ...mapping, guardianRelationship: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري (افتراضي: ولي أمر) --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">الفوج أو المادة (Group/Course):</label>
                    <select
                      value={mapping.groupName}
                      onChange={(e) => setMapping({ ...mapping, groupName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">الجنس (Gender):</label>
                    <select
                      value={mapping.gender}
                      onChange={(e) => setMapping({ ...mapping, gender: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="">-- اختياري (افتراضي: ذكر) --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Import Options Checkboxes */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.createCards}
                    onChange={(e) => setOptions({ ...options, createCards: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>توليد بطاقة رقمية ورمز EDP2 مشفر تلقائياً لكل طالب مستورد</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.skipDuplicates}
                    onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>تخطي الطلاب المتكررين بنفس الاسم ورقم الهاتف بدون إحداث أخطاء</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Results Summary */}
          {step === 3 && result && (
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">اكتمل الاستيراد بنجاح!</h3>
                <p className="text-xs text-slate-500 mt-1">تمت معالجة جدول البيانات وتحديث سجلات الطلاب في قاعدة البيانات</p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-slate-500 block">تم استيرادهم</span>
                  <span className="text-lg font-black text-emerald-700">{result.importedCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-slate-500 block">متكرر تم تخطيه</span>
                  <span className="text-lg font-black text-amber-700">{result.duplicateCount}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 block">أخطاء</span>
                  <span className="text-lg font-black text-slate-700">{result.errorCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> السابق
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={handleExecuteImport}
                disabled={loading || (!mapping.lastName && !mapping.fullName)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                بدء عملية الاستيراد
              </button>
            )}

            {step === 3 && (
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق وفتح القائمة
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
