import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, GraduationCap, BookOpen, Users, X, ArrowRight, CornerDownLeft } from 'lucide-react'
import type { GlobalSearchResult } from '../../shared/types/index'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult>({ students: [], teachers: [], courses: [], groups: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults({ students: [], teachers: [], courses: [], groups: [] })
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Flattened list for keyboard selection
  const flatItems: Array<{ type: 'student' | 'teacher' | 'course' | 'group'; id: number; path: string; title: string }> = [
    ...results.students.map((s) => ({ type: 'student' as const, id: s.id, path: `/students/${s.id}`, title: s.name })),
    ...results.teachers.map((t) => ({ type: 'teacher' as const, id: t.id, path: `/teachers`, title: t.name })),
    ...results.courses.map((c) => ({ type: 'course' as const, id: c.id, path: `/courses`, title: c.name })),
    ...results.groups.map((g) => ({ type: 'group' as const, id: g.id, path: `/courses`, title: g.name })),
  ]

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ students: [], teachers: [], courses: [], groups: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await window.schoolApp?.search?.global(query.trim())
        if (res && res.success && res.data) {
          setResults(res.data)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
        setSelectedIndex(0)
      }
    }, 150)

    return () => clearTimeout(timeout)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (flatItems.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = flatItems[selectedIndex]
      if (target) {
        onClose()
        navigate(target.path)
      }
    }
  }

  if (!isOpen) return null

  const totalResults = results.students.length + results.teachers.length + results.courses.length + results.groups.length

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-100 flex items-center px-4 py-3.5 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students (name, code, phone), teachers, courses, or groups..."
            className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Searching database...
            </div>
          )}

          {!loading && query.trim().length >= 2 && totalResults === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try checking for typos or searching by phone or registration code.</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="py-10 text-center text-slate-400 text-xs">
              Type at least 2 characters to search across all school records...
            </div>
          )}

          {/* Students Category */}
          {results.students.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Students ({results.students.length})
              </div>
              <div className="mt-1 space-y-1">
                {results.students.map((s) => {
                  const itemIndex = flatItems.findIndex((x) => x.type === 'student' && x.id === s.id)
                  const isSelected = itemIndex === selectedIndex
                  return (
                    <div
                      key={`student_${s.id}`}
                      onClick={() => {
                        onClose()
                        navigate(`/students/${s.id}`)
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.number} {s.groupName ? `• ${s.groupName}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {s.balance.toLocaleString()} DZD
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Teachers Category */}
          {results.teachers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                Teachers ({results.teachers.length})
              </div>
              <div className="mt-1 space-y-1">
                {results.teachers.map((t) => {
                  const itemIndex = flatItems.findIndex((x) => x.type === 'teacher' && x.id === t.id)
                  const isSelected = itemIndex === selectedIndex
                  return (
                    <div
                      key={`teacher_${t.id}`}
                      onClick={() => {
                        onClose()
                        navigate(`/teachers`)
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-50 border border-purple-200 text-purple-900' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                          <p className="text-xs text-slate-400 truncate">{t.courseName || t.phone || 'Teacher'}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Courses & Groups Category */}
          {(results.courses.length > 0 || results.groups.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.courses.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    Courses
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.courses.map((c) => (
                      <div
                        key={`course_${c.id}`}
                        onClick={() => {
                          onClose()
                          navigate(`/courses`)
                        }}
                        className="px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer"
                      >
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.price.toLocaleString()} DZD</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.groups.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    Groups
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.groups.map((g) => (
                      <div
                        key={`group_${g.id}`}
                        onClick={() => {
                          onClose()
                          navigate(`/courses`)
                        }}
                        className="px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer"
                      >
                        <p className="text-sm font-semibold text-slate-800 truncate">{g.name}</p>
                        <p className="text-xs text-slate-400 truncate">{g.courseName} • {g.teacherName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-slate-400" /> to select
            </span>
          </div>
          <span>Edupilot 2.0 Fast Search</span>
        </div>
      </div>
    </div>
  )
}
