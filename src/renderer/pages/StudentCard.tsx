import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Printer, Download, CreditCard, Receipt, Layers,
  RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Phone, MapPin
} from 'lucide-react'
import QRCode from 'qrcode'
import type { Student, Enrollment, StudentCardInfo } from '../../shared/types/index'
import appIcon from '../assets/icon.png'

interface SchoolInfo {
  schoolNameAr: string
  schoolNameFr: string
  academicYear: string
  phone?: string | null
  address?: string | null
  logoPath?: string | null
  logoUrl?: string | null
}

export default function StudentCard() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState<Student | null>(null)
  const [school, setSchool] = useState<SchoolInfo>({
    schoolNameAr: 'مدرسة التميز الخاصة',
    schoolNameFr: 'ÉCOLE PRIVÉE EXCELLENCE',
    academicYear: '2025-2026',
    phone: '0550 00 00 00',
    address: 'Alger, Algérie',
  })
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [activeCard, setActiveCard] = useState<StudentCardInfo | null>(null)
  const [cardHistory, setCardHistory] = useState<StudentCardInfo[]>([])
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [cardMode, setCardMode] = useState<'cr80' | 'thermal' | 'a4_batch'>('cr80')
  const [flipCard, setFlipCard] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const studentId = Number(id)
        const [studentRes, settingsRes, enrollRes, cardsRes] = await Promise.all([
          window.schoolApp.students.getById(studentId),
          window.schoolApp.settings.get(),
          window.schoolApp.enrollments.byStudent(studentId),
          window.schoolApp.cards.getByStudent(studentId),
        ])

        if (studentRes.success && studentRes.data) {
          const s = studentRes.data
          setStudent(s)
          if (s.photoPath) {
            try {
              const photoRes = await window.schoolApp.media.getImageUrl(s.photoPath)
              if (photoRes.success && photoRes.data?.url) setPhotoUrl(photoRes.data.url)
            } catch {}
          }
        }

        if (settingsRes.success && settingsRes.data) {
          const sett = settingsRes.data as any
          let logoDataUrl: string | null = null
          if (sett.logoPath) {
            try {
              const lRes = await window.schoolApp.media.getImageUrl(sett.logoPath)
              if (lRes.success && lRes.data?.url) logoDataUrl = lRes.data.url
            } catch {}
          }

          setSchool({
            schoolNameAr: sett.schoolNameAr || 'مدرسة المستقبل',
            schoolNameFr: sett.schoolNameFr || 'ÉCOLE DU FUTUR',
            academicYear: sett.academicYear || '2025-2026',
            phone: sett.phone,
            address: sett.address,
            logoPath: sett.logoPath,
            logoUrl: logoDataUrl,
          })
        }

        if (enrollRes.success && enrollRes.data) {
          setEnrollments(enrollRes.data)
        }

        if (cardsRes.success && cardsRes.data) {
          setActiveCard(cardsRes.data.activeCard)
          setCardHistory(cardsRes.data.cards)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const fullNameAr = student ? `${student.lastNameAr} ${student.firstNameAr}` : ''
  const fullNameFr = student ? `${student.lastNameFr} ${student.firstNameFr}` : ''
  const initials = student ? (student.firstNameAr.charAt(0) + student.lastNameAr.charAt(0)) : ''

  const activeEnrollments = useMemo(() => {
    const active = enrollments.filter((e) => e.status === 'active')
    return active.length > 0 ? active : enrollments
  }, [enrollments])

  // CRITICAL SECURITY RULE: Encode ONLY the secure token EDP2:... in the QR code!
  const secureToken = activeCard?.cardToken || student?.qrToken || `EDP2:${student?.id || '000'}`

  useEffect(() => {
    if (secureToken) {
      QRCode.toDataURL(secureToken, {
        width: 320,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err))
    }
  }, [secureToken])

  const handlePrint = async () => {
    setPrinting(true)
    try {
      await window.schoolApp.app.print()
    } finally {
      setPrinting(false)
    }
  }

  const handleSavePDF = async () => {
    setPrinting(true)
    try {
      await window.schoolApp.app.printToPdf({
        pageSize: cardMode === 'thermal' ? 'Letter' : 'A4',
        marginsType: 0,
        filename: `Carte-${student?.studentNumber || 'etudiant'}.pdf`,
      })
    } finally {
      setPrinting(false)
    }
  }

  const handleIssueNewCard = async () => {
    if (!student) return
    try {
      const res = await window.schoolApp.cards.issue(student.id, { notes: 'Issued from student card manager' })
      if (res.success && res.data) {
        setActiveCard(res.data)
        setCardHistory((prev) => [res.data, ...prev])
        setActionMessage('تم إصدار بطاقة جديدة بنجاح وتحديث رمز QR المشفر')
        setTimeout(() => setActionMessage(null), 4000)
      }
    } catch {}
  }

  const handleMarkLost = async () => {
    if (!activeCard) return
    const confirmed = window.confirm('هل أنت متأكد من الإبلاغ عن فقدان هذه البطاقة؟ سيتم إيقافها فوراً لمنع الاستخدام.')
    if (!confirmed) return
    try {
      const res = await window.schoolApp.cards.markLost(activeCard.id, 'Reported lost by student/guardian')
      if (res.success && res.data) {
        setActiveCard(null)
        setCardHistory((prev) => prev.map((c) => (c.id === activeCard.id ? res.data : c)))
        setActionMessage('تم إلغاء تفعيل البطاقة المفقودة بنجاح')
        setTimeout(() => setActionMessage(null), 4000)
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-sm font-semibold">الطالب غير موجود</p>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────────────────────
     1. CR80 Standard Plastic Card Component (Front & Back)
     Exact Dimensions: 85.6mm x 54mm (ratio ~ 1.585)
     Palette: Deep Navy #0A192F, Accent Teal #0D9488, Gold #F59E0B
  ────────────────────────────────────────────────────────────────────────── */
  const Cr80CardFront = () => (
    <div
      className="cr80-card-front relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 text-white select-none shrink-0"
      style={{
        width: '85.6mm',
        height: '54mm',
        backgroundColor: '#0A192F',
        boxSizing: 'border-box',
        padding: '3.5mm 4mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Decorative concentric geometry in top-right */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full border-2 border-teal-500/20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, rgba(10,25,47,0) 70%)' }}
      />
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full border border-teal-400/25 pointer-events-none" />

      {/* Top Bar: School Logo & Identity */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-sm flex items-center justify-center shrink-0">
            <img src={school.logoUrl || appIcon} alt="School Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[9.5pt] font-black leading-tight truncate tracking-wide text-white" dir="rtl">
              {school.schoolNameAr}
            </h3>
            <p className="text-[5.5pt] font-bold uppercase tracking-wider text-teal-400 truncate">
              {school.schoolNameFr}
            </p>
          </div>
        </div>

        <div className="text-end shrink-0 ps-1">
          <span className="inline-block px-1.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-[5.5pt] font-mono text-teal-300 font-bold">
            {school.academicYear}
          </span>
          <p className="text-[5pt] text-slate-400 font-medium tracking-tight mt-0.5">بطاقة الطالب • STUDENT</p>
        </div>
      </div>

      {/* Center Body: Student Photo + Info + Secure QR */}
      <div className="flex items-center justify-between gap-2.5 z-10 my-auto">
        {/* Photo Container */}
        <div className="relative shrink-0">
          <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-teal-400 shadow-md bg-slate-800 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt={fullNameFr} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-teal-300">{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-teal-600 rounded text-[4.5pt] font-bold uppercase text-white shadow-xs">
            {student.gender === 'male' ? 'M' : 'F'}
          </div>
        </div>

        {/* Student Data */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-[11pt] font-bold text-white leading-tight truncate" dir="rtl">
            {fullNameAr}
          </h2>
          <p className="text-[7pt] font-semibold text-slate-300 leading-tight truncate mt-0.5">
            {fullNameFr}
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <div className="bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded-md">
              <span className="text-[5pt] text-slate-400 block font-medium">MATRICULE</span>
              <span className="text-[7.5pt] font-mono font-bold text-teal-300 tracking-wider">
                {student.studentNumber}
              </span>
            </div>
          </div>

          {/* Active groups tags */}
          <div className="mt-1 flex flex-wrap gap-1 max-h-5 overflow-hidden">
            {activeEnrollments.slice(0, 2).map((en, idx) => (
              <span
                key={idx}
                className="text-[5pt] font-medium bg-white/10 px-1 py-0.2 rounded text-slate-300 truncate max-w-[28mm]"
              >
                {en.courseName || en.groupName}
              </span>
            ))}
          </div>
        </div>

        {/* High-density QR Code (ENCODES ONLY EDP2:TOKEN) */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-16 h-16 p-1 bg-white rounded-xl shadow-md border border-teal-400/40 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Secure Token QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse" />
            )}
          </div>
          <span className="text-[4pt] font-mono text-slate-400 mt-0.5 uppercase tracking-tight">
            SECURE TOKEN
          </span>
        </div>
      </div>

      {/* Bottom Footer: Security & Edupilot badge */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 text-[5pt] text-slate-400 z-10">
        <span className="flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          VERIFIED STUDENT ID
        </span>
        <span className="text-slate-500 font-semibold tracking-wide">
          Powered by <strong className="text-slate-400">Edupilot 2.0</strong>
        </span>
      </div>
    </div>
  )

  const Cr80CardBack = () => (
    <div
      className="cr80-card-back relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 text-white select-none shrink-0"
      style={{
        width: '85.6mm',
        height: '54mm',
        backgroundColor: '#071224',
        boxSizing: 'border-box',
        padding: '3.5mm 4mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
        <span className="text-[6pt] font-bold text-teal-400">شروط الاستخدام • TERMS</span>
        <span className="text-[5.5pt] text-slate-400">{school.schoolNameFr}</span>
      </div>

      <div className="text-[5pt] text-slate-300 space-y-1 my-auto leading-relaxed" dir="rtl">
        <p>• هذه البطاقة شخصية وصالحة للعام الدراسي {school.academicYear} فقط.</p>
        <p>• يجب إبراز البطاقة عند كل حضور لمسح رمز الحضور الذكي.</p>
        <p>• في حالة ضياع البطاقة، يرجى التبليغ فوراً لدى الإدارة لإلغائها وإصدار بديل.</p>
        <p>• إذا وجدت هذه البطاقة يرجى إعادتها إلى مقر المؤسسة المبين أدناه.</p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-[5pt]">
        <div className="space-y-0.5">
          {school.phone && (
            <div className="flex items-center gap-1 text-slate-300">
              <Phone className="w-2.5 h-2.5 text-teal-400" />
              <span>{school.phone}</span>
            </div>
          )}
          {school.address && (
            <div className="flex items-center gap-1 text-slate-400 truncate max-w-[50mm]">
              <MapPin className="w-2.5 h-2.5 text-teal-400" />
              <span className="truncate">{school.address}</span>
            </div>
          )}
        </div>

        <div className="text-end border-s border-slate-800 ps-2">
          <span className="text-[4.5pt] text-slate-500 block">توقيع الإدارة</span>
          <div className="w-16 h-4 border-b border-dashed border-slate-600 mt-1" />
        </div>
      </div>

      <div className="text-[4.5pt] text-center text-slate-500">
        Edupilot Commercial • Offline Encrypted Security
      </div>
    </div>
  )

  /* ──────────────────────────────────────────────────────────────────────────
     2. 80mm Thermal Receipt Ticket Component
  ────────────────────────────────────────────────────────────────────────── */
  const ThermalTicket = () => (
    <div
      className="thermal-ticket-card"
      style={{
        width: '80mm',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: "'Courier New', Courier, monospace",
        padding: '5mm',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>{school.schoolNameFr}</div>
        <div style={{ fontSize: '10pt', fontWeight: 'bold', direction: 'rtl', marginTop: '1mm' }}>{school.schoolNameAr}</div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }} />
        <div style={{ fontSize: '9pt', fontWeight: 'bold', letterSpacing: '1px' }}>TICKET ÉTUDIANT (QR)</div>
        <div style={{ fontSize: '7.5pt', color: '#555' }}>Année: {school.academicYear}</div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2.5mm' }}>
        <div style={{ fontSize: '12pt', fontWeight: 'bold', direction: 'rtl' }}>{fullNameAr}</div>
        <div style={{ fontSize: '9pt', marginTop: '1mm' }}>{fullNameFr}</div>
        <div style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '1mm', fontFamily: 'monospace' }}>
          MATRICULE: {student.studentNumber}
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }} />

      {/* Courses List */}
      <div style={{ fontSize: '8pt', lineHeight: '1.5' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>CLASSES INSCRITES:</div>
        {activeEnrollments.map((en, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>• {en.courseName || en.groupName}</span>
            <span>{en.teacherName || ''}</span>
          </div>
        ))}
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }} />

      {/* QR Code */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2mm 0' }}>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR" style={{ width: '40mm', height: '40mm', imageRendering: 'pixelated' }} />
        )}
        <span style={{ fontSize: '6.5pt', color: '#555', marginTop: '1mm', fontFamily: 'monospace' }}>
          {secureToken.slice(0, 18)}...
        </span>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }} />
      <div style={{ textAlign: 'center', fontSize: '6.5pt', color: '#666' }}>
        <div>Scannez ce QR code pour enregistrer la présence</div>
        <div>Inscrit le: {student.registrationDate} • Edupilot 2.0</div>
      </div>
    </div>
  )

  /* ──────────────────────────────────────────────────────────────────────────
     3. A4 Batch Printing Sheet (8 cards on 1 page)
  ────────────────────────────────────────────────────────────────────────── */
  const A4BatchSheet = () => (
    <div
      className="a4-batch-sheet grid grid-cols-2 gap-4 p-8 bg-white"
      style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="scale-95 origin-top-left">
          <Cr80CardFront />
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .printable-card-target,
          .printable-card-target * { visibility: visible !important; }
          .printable-card-target {
            position: absolute !important;
            left: 50% !important;
            top: 5mm !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>

      {/* Hidden container targeted by print dialog */}
      <div className="printable-card-target" style={{ position: 'fixed', left: '-9999px', top: 0, visibility: 'hidden' }}>
        {cardMode === 'cr80' && <Cr80CardFront />}
        {cardMode === 'thermal' && <ThermalTicket />}
        {cardMode === 'a4_batch' && <A4BatchSheet />}
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة لملف الطالب
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setCardMode('cr80'); setFlipCard(false) }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                cardMode === 'cr80' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              بطاقة بلاستيكية CR80
            </button>
            <button
              onClick={() => setCardMode('thermal')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                cardMode === 'thermal' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              تذكرة حرارية 80 مم
            </button>
            <button
              onClick={() => setCardMode('a4_batch')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                cardMode === 'a4_batch' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              ورقة A4 جماعية (8)
            </button>
          </div>

          {/* Print & PDF Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePDF}
              disabled={printing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              حفظ PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة البطاقة
            </button>
          </div>
        </div>

        {/* Action notification message */}
        {actionMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Main Preview Center Stage */}
        <div className="bg-slate-900/90 rounded-3xl p-8 sm:p-12 border border-slate-800 flex flex-col items-center justify-center min-h-[420px] shadow-2xl relative overflow-hidden">
          {cardMode === 'cr80' && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="cursor-pointer transition-transform duration-300 hover:scale-102"
                onClick={() => setFlipCard(!flipCard)}
                title="انقر لقلب البطاقة للوجه الآخر"
              >
                {!flipCard ? <Cr80CardFront /> : <Cr80CardBack />}
              </div>

              <button
                type="button"
                onClick={() => setFlipCard(!flipCard)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {flipCard ? 'عرض الوجه الأمامي' : 'عرض الوجه الخلفي للبطاقة'}
              </button>
            </div>
          )}

          {cardMode === 'thermal' && (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden p-2 max-w-sm">
              <ThermalTicket />
            </div>
          )}

          {cardMode === 'a4_batch' && (
            <div className="overflow-x-auto max-w-full bg-slate-800 p-4 rounded-2xl">
              <div className="scale-75 origin-top">
                <A4BatchSheet />
              </div>
            </div>
          )}
        </div>

        {/* Card Lifecycle & Security Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">إدارة دورة حياة بطاقة الطالب (Lifecycle & Security)</h3>
                <p className="text-xs text-slate-500">حالة البطاقة الحالية، الرمز المشفر، وسجل الإصدارات</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleIssueNewCard}
                className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
              >
                إصدار بطاقة جديدة
              </button>
              {activeCard && (
                <button
                  onClick={handleMarkLost}
                  className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  الإبلاغ عن ضياع
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">الحالة الحالية:</span>
              <span className={`font-bold inline-flex items-center gap-1 ${
                activeCard?.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeCard?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {activeCard?.status || 'لم تصدر بطاقة رسمية'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">الرمز المشفر (QR Token):</span>
              <span className="font-mono font-bold text-slate-800 truncate block" title={secureToken}>
                {secureToken}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">تاريخ الإصدار:</span>
              <span className="font-semibold text-slate-800">
                {activeCard?.issuedAt?.slice(0, 10) || student.registrationDate}
              </span>
            </div>
          </div>

          {cardHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">سجل البطاقات السابقة:</h4>
              <div className="space-y-1.5">
                {cardHistory.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs text-slate-600">
                    <span className="font-mono text-[11px]">{c.cardToken.slice(0, 20)}...</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-slate-400 text-[11px]">{c.issuedAt?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
