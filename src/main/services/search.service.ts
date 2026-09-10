import { getSqlite } from '../database/connection'
import type { GlobalSearchResult } from '../../shared/types/index'

export function performGlobalSearch(query: string): GlobalSearchResult {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) {
    return { students: [], teachers: [], courses: [], groups: [] }
  }

  const sqlite = getSqlite()
  const q = `%${trimmed}%`

  const result: GlobalSearchResult = {
    students: [],
    teachers: [],
    courses: [],
    groups: [],
  }

  // 1. Search Students
  try {
    const studentRows = sqlite.prepare(`
      SELECT s.id, s.student_number, s.first_name_ar, s.last_name_ar, s.first_name_fr, s.last_name_fr, s.phone, s.photo_path,
             (SELECT g.name FROM enrollments e JOIN groups g ON e.group_id = g.id WHERE e.student_id = s.id AND e.status = 'active' LIMIT 1) as group_name,
             COALESCE((
               SELECT SUM(
                 CASE 
                   WHEN p.status = 'cancelled' THEN 0
                   WHEN p.payment_type IN ('credit', 'payment', 'transfer_in') THEN p.amount
                   WHEN p.payment_type IN ('deduction', 'session_charge', 'transfer_out', 'refund', 'enrollment_refund') THEN -p.amount
                   ELSE p.amount
                 END
               ) FROM payments p WHERE p.student_id = s.id
             ), 0) as balance
      FROM students s
      WHERE s.status != 'archived'
        AND (
          s.first_name_ar LIKE ? OR s.last_name_ar LIKE ?
          OR s.first_name_fr LIKE ? OR s.last_name_fr LIKE ?
          OR s.student_number LIKE ? OR s.phone LIKE ?
          OR (s.last_name_ar || ' ' || s.first_name_ar) LIKE ?
          OR (s.first_name_fr || ' ' || s.last_name_fr) LIKE ?
        )
      LIMIT 8
    `).all(q, q, q, q, q, q, q, q) as any[]

    result.students = studentRows.map((s) => ({
      id: s.id,
      name: s.first_name_ar ? `${s.first_name_ar} ${s.last_name_ar}` : `${s.first_name_fr} ${s.last_name_fr}`,
      number: s.student_number || '',
      photoUrl: s.photo_path || null,
      groupName: s.group_name || undefined,
      balance: Number(s.balance || 0),
    }))
  } catch {}

  // 2. Search Teachers
  try {
    const teacherRows = sqlite.prepare(`
      SELECT t.id, t.first_name, t.last_name, t.phone,
             (SELECT c.name_ar FROM courses c WHERE c.id = t.course_id LIMIT 1) as course_name
      FROM teachers t
      WHERE t.status != 'archived'
        AND (
          t.first_name LIKE ? OR t.last_name LIKE ?
          OR t.phone LIKE ? OR (t.first_name || ' ' || t.last_name) LIKE ?
        )
      LIMIT 6
    `).all(q, q, q, q) as any[]

    result.teachers = teacherRows.map((t) => ({
      id: t.id,
      name: `${t.first_name} ${t.last_name}`,
      phone: t.phone || null,
      courseName: t.course_name || undefined,
    }))
  } catch {}

  // 3. Search Courses
  try {
    const courseRows = sqlite.prepare(`
      SELECT id, name_ar, name_fr, name_en, default_price
      FROM courses
      WHERE status = 'active'
        AND (name_ar LIKE ? OR name_fr LIKE ? OR name_en LIKE ?)
      LIMIT 6
    `).all(q, q, q) as any[]

    result.courses = courseRows.map((c) => ({
      id: c.id,
      name: c.name_ar || c.name_fr || c.name_en || 'Course',
      price: Number(c.default_price || 0),
    }))
  } catch {}

  // 4. Search Groups
  try {
    const groupRows = sqlite.prepare(`
      SELECT g.id, g.name, c.name_ar as course_name, (t.first_name || ' ' || t.last_name) as teacher_name
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.status = 'active'
        AND (g.name LIKE ? OR g.room LIKE ?)
      LIMIT 6
    `).all(q, q) as any[]

    result.groups = groupRows.map((g) => ({
      id: g.id,
      name: g.name,
      courseName: g.course_name || '',
      teacherName: g.teacher_name || '',
    }))
  } catch {}

  return result
}
