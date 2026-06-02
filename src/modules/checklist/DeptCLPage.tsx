import { useState } from 'react'
import { useDeptChecklist } from './useDeptChecklist'
import { useProfile } from '../../components/Layout'

const FREQ_COLORS: Record<string, { bg: string; color: string }> = {
  daily:       { bg: '#EFF6FF', color: '#2563EB' },
  weekly:      { bg: '#F0FDF4', color: '#16A34A' },
  fortnightly: { bg: '#F5F3FF', color: '#7C3AED' },
  monthly:     { bg: '#FFF7ED', color: '#EA580C' },
  quarterly:   { bg: '#FEF2F2', color: '#DC2626' },
  'half yrly': { bg: '#FDF4FF', color: '#9333EA' },
  yearly:      { bg: '#F9FAFB', color: '#374151' },
}

function freqLabel(freq: string) {
  const map: Record<string, string> = {
    daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly',
    monthly: 'Monthly', quarterly: 'Quarterly',
    'half yrly': 'Half Yearly', yearly: 'Yearly',
  }
  return map[freq?.toLowerCase()] ?? freq ?? '—'
}

function FreqBadge({ freq }: { freq: string }) {
  const key = freq?.toLowerCase() ?? ''
  const style = FREQ_COLORS[key] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      backgroundColor: style.bg, color: style.color,
      textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
    }}>
      {freqLabel(freq)}
    </span>
  )
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
const now = new Date()
const MONTH_LABEL = now.toLocaleString('default', { month: 'long', year: 'numeric' })
const CURRENT_MONTH_NAME = now.toLocaleString('default', { month: 'short' }).toUpperCase() // e.g. "JUN"
const DAYS_IN_MONTH = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
const ALL_DAYS = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1)

function buildWeeks(days: number[]) {
  const weeks: number[][] = []
  let week: number[] = []
  days.forEach(d => {
    week.push(d)
    const dow = new Date(now.getFullYear(), now.getMonth(), d).getDay()
    if (dow === 0 || d === days[days.length - 1]) { weeks.push(week); week = [] }
  })
  return weeks
}
const WEEKS = buildWeeks(ALL_DAYS)

// Parse a day number from strings like "2nd", "12th", "30", "05th"
function parseDay(str: string): number {
  const n = parseInt(str.replace(/\D/g, ''), 10)
  return isNaN(n) ? 0 : n
}

// Check if a month abbreviation matches current month
function monthMatches(monthStr: string): boolean {
  return monthStr.toUpperCase().includes(CURRENT_MONTH_NAME)
}

// Returns set of days that should be pre-highlighted (green M) based on freq + tat
function getScheduledDays(freq: string, tat: string): Set<number> {
  const f = freq?.toLowerCase() ?? ''
  const t = tat?.trim() ?? ''
  const days = new Set<number>()

  if (f === 'daily') {
    ALL_DAYS.forEach(d => days.add(d))
    return days
  }

  if (f === 'weekly') {
    // Every 7 days starting from day 1
    for (let d = 1; d <= DAYS_IN_MONTH; d += 7) days.add(d)
    return days
  }

  if (f === 'fortnightly') {
    // Parse "15,30" or "15,31" or default to 15,30
    if (t) {
      t.split(',').forEach(s => { const d = parseDay(s); if (d > 0) days.add(d) })
    } else {
      days.add(15); days.add(30)
    }
    return days
  }

  if (f === 'monthly') {
    if (t) {
      const cleaned = t.trim().replace(/[^0-9]/g, '')
      const d = parseInt(cleaned, 10)
      if (!isNaN(d) && d > 0 && d <= 31) days.add(d)
    }
    return days
  }

  if (f === 'quarterly' || f === 'half yrly' || f === 'yearly') {
    // e.g. "26th JAN,APR,JUL,OCT" or "05th APR,NOV" or "22th MAR,JUN,SEP,DEC"
    if (!t) return days
    // Split by space: first part = day, rest = months
    const parts = t.split(' ')
    const dayNum = parseDay(parts[0])
    if (dayNum === 0) return days
    // Check if any of the listed months match current month
    const monthsPart = parts.slice(1).join(' ') // "JAN,APR,JUL,OCT"
    if (monthMatches(monthsPart)) days.add(dayNum)
    return days
  }

  return days
}

// ── Table cell styles ─────────────────────────────────────────────────────────
const th: React.CSSProperties = {
  border: '1px solid #D1D5DB', padding: '6px 8px', fontSize: 11,
  fontWeight: 700, color: '#6B7280', backgroundColor: '#F9FAFB',
  textAlign: 'left', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = {
  border: '1px solid #E5E7EB', padding: '8px 8px', fontSize: 12,
  verticalAlign: 'middle', whiteSpace: 'nowrap',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DeptCLPage() {
  const profile = useProfile()
  const {
    templates, allDepts, selectedDept, loading,
    setSelectedDept, toggle, addTemplate, editTemplate, deleteTemplate,
    getMyEntry, getAllEntries, myDoneCount, progress,
  } = useDeptChecklist(profile.user_id, profile.role)

  const isManager = ['owner', 'ea', 'mis'].includes(profile.role)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newTat, setNewTat] = useState('')
  const [newFreq, setNewFreq] = useState('monthly')
  const [newPriority, setNewPriority] = useState('medium')
  const [freqFilter, setFreqFilter] = useState<string>('all')
  const [editingTask, setEditingTask] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
 const [extraMarks, setExtraMarks] = useState<Record<string, Record<number, boolean>>>({})

  async function handleAdd() {
    if (!newTask.trim()) return
    await addTemplate(newTask.trim(), newTat.trim() || '')
    setNewTask(''); setNewTat(''); setNewFreq('monthly'); setNewPriority('medium'); setShowAdd(false)
  }

  async function handleEdit() {
    if (!editForm.task?.trim()) return
    await editTemplate(editingTask.id, {
      title: editForm.task,
      type: editForm.frequency,
      tat: editForm.tat,
      priority: editForm.priority || 'medium',
      contact_person: editForm.contact_person,
      mob: editForm.mob,
      person_accountable: editForm.person_accountable,
    } as any)
    setEditingTask(null)
  }

  function toggleDay(taskId: string, day: number, isScheduled: boolean) {
    // Scheduled days can't be manually untoggled — they're fixed by the schedule
    if (isScheduled) return
    setExtraMarks(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? {}), [day]: !(prev[taskId]?.[day]) }
    }))
  }

  const availableFreqs = Array.from(new Set(templates.map(t => t.frequency?.toLowerCase()).filter(Boolean)))
  const filtered = freqFilter === 'all'
    ? templates
    : templates.filter(t => t.frequency?.toLowerCase() === freqFilter)

  const pctColor = progress === 100 ? '#16A34A' : progress >= 50 ? '#D97706' : '#DC2626'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>Department Checklist</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>Shared checklist for your team</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {templates.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: pctColor, margin: 0, lineHeight: 1 }}>{progress}%</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{myDoneCount}/{templates.length}</p>
            </div>
          )}
          {isManager && (
            <button onClick={() => setShowAdd(true)} style={{
              backgroundColor: '#111', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>+ Add Task</button>
          )}
        </div>
      </div>

      {/* Dept tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: '1px solid #E5E7EB', overflowX: 'auto' }}>
        {allDepts.map(dept => (
          <button key={dept} onClick={() => { setSelectedDept(dept); setFreqFilter('all') }} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            borderBottom: selectedDept === dept ? '2px solid #111' : '2px solid transparent',
            color: selectedDept === dept ? '#111' : '#9CA3AF', marginBottom: -1,
          }}>{dept}</button>
        ))}
      </div>

      {/* Progress bar */}
      {templates.length > 0 && (
        <div style={{ height: 3, backgroundColor: '#F3F4F6', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: 3, width: `${progress}%`, backgroundColor: pctColor, transition: 'width 0.3s' }} />
        </div>
      )}

      {/* Freq filter pills */}
      {availableFreqs.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', ...availableFreqs].map(f => (
            <button key={f} onClick={() => setFreqFilter(f)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              backgroundColor: freqFilter === f ? '#111' : '#F3F4F6',
              color: freqFilter === f ? '#fff' : '#6B7280',
            }}>
              {f === 'all' ? 'All' : freqLabel(f)}
            </button>
          ))}
        </div>
      )}

      {/* Add task form */}
      {showAdd && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>Add Task — {selectedDept}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>TASK *</label>
              <input style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Task description" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>DUE DATES</label>
              <input style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                value={newTat} onChange={e => setNewTat(e.target.value)} placeholder="e.g. 12th or 15,30" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>FREQUENCY</label>
              <select style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                value={newFreq} onChange={e => setNewFreq(e.target.value)}>
                {['daily','weekly','fortnightly','monthly','quarterly','half yrly','yearly'].map(f => (
                  <option key={f} value={f}>{freqLabel(f)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setShowAdd(false)} style={{ border: '1px solid #E5E7EB', backgroundColor: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAdd} style={{ backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add Task</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</p>
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No tasks for this department yet.</p>
          {isManager && <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Add tasks in Task Manager and assign to this department.</p>}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
        {/* Group by sub_category */}
        {(() => {
          const cats = ['Office Maintenance', 'Security & Reception', 'Factory Floor Up Keep', 'Courier Sending & Tracking']
          const uncategorized = filtered.filter(t => !t.sub_category)
          const categorized = cats.map(cat => ({ cat, tasks: filtered.filter(t => t.sub_category === cat) })).filter(g => g.tasks.length > 0)
          const groups = [...categorized, ...(uncategorized.length > 0 ? [{ cat: 'General', tasks: uncategorized }] : [])]

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {groups.map(({ cat, tasks: groupTasks }) => (
                <div key={cat} style={{ flex: '0 0 auto', minWidth: 320, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Category header */}
                  <div style={{ backgroundColor: '#1D4ED8', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
                    {cat}
                  </div>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, backgroundColor: '#DBEAFE', color: '#1D4ED8', textAlign: 'center' }} colSpan={ALL_DAYS.length + 7}>
                          {MONTH_LABEL}
                        </th>
                      </tr>
                      <tr>
                        <th style={{ ...th, backgroundColor: '#F9FAFB' }} colSpan={7} />
                        {WEEKS.map((wk, wi) => (
                          <th key={wi} colSpan={wk.length} style={{ ...th, backgroundColor: '#EFF6FF', color: '#2563EB', textAlign: 'center' }}>
                            W{wi + 1}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        <th style={{ ...th, minWidth: 140 }}>Task</th>
                        <th style={{ ...th, minWidth: 70 }}>Freq</th>
                        <th style={{ ...th, minWidth: 70 }}>Last Done</th>
                        <th style={{ ...th, minWidth: 110 }}>Contact Person</th>
                        <th style={{ ...th, minWidth: 90 }}>Mobile</th>
                        <th style={{ ...th, minWidth: 110 }}>Accountable</th>
                        <th style={{ ...th, minWidth: 60 }}>Status</th>
                        {ALL_DAYS.map(d => (
                          <th key={d} style={{ ...th, width: 24, minWidth: 24, padding: '3px 1px', textAlign: 'center' }}>{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupTasks.map(t => {
                        const myEntry = getMyEntry(t.id)
                        const isDone = myEntry?.done || false
                        const scheduledDays = getScheduledDays(t.frequency, t.tat)
                        return (
                          <tr key={t.id} style={{ backgroundColor: isDone ? '#F9FAFB' : '#fff' }}>
                            <td style={td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button onClick={() => toggle(t.id, profile.name)} style={{
                                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                  border: isDone ? 'none' : '1.5px solid #D1D5DB',
                                  backgroundColor: isDone ? '#111' : '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                }}>
                                  {isDone && <svg width="9" height="7" viewBox="0 0 11 9" fill="none"><path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </button>
                                <span style={{ fontSize: 11, fontWeight: isDone ? 400 : 600, color: isDone ? '#9CA3AF' : '#111', textDecoration: isDone ? 'line-through' : 'none' }}>{t.task}</span>
                                {isManager && (
                                  <button onClick={() => { setEditingTask(t); setEditForm({ task: t.task, frequency: t.frequency, tat: t.tat, priority: 'medium', contact_person: t.contact_person, mob: t.mob, person_accountable: t.person_accountable }) }}
                                    style={{ fontSize: 9, padding: '1px 5px', border: '1px solid #E5E7EB', borderRadius: 3, cursor: 'pointer', backgroundColor: '#fff', color: '#6B7280' }}>
                                    Edit
                                  </button>
                                )}
                              </div>
                            </td>
                            <td style={td}><FreqBadge freq={t.frequency} /></td>
                            <td style={{ ...td, color: '#16A34A', fontSize: 10 }}>{t.last_done ? new Date(t.last_done).toLocaleDateString('en-GB') : '—'}</td>
                            <td style={{ ...td, fontSize: 11 }}>{t.contact_person || '—'}</td>
                            <td style={{ ...td, fontSize: 11 }}>{t.mob || '—'}</td>
                            <td style={{ ...td, fontSize: 11 }}>{t.person_accountable || '—'}</td>
                            <td style={td}>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, backgroundColor: isDone ? '#DCFCE7' : '#FEF9C3', color: isDone ? '#16A34A' : '#CA8A04' }}>
                                {isDone ? 'Done' : 'Pending'}
                              </span>
                            </td>
                            {ALL_DAYS.map(d => {
                              const isScheduled = scheduledDays.has(d)
                              return (
                                <td key={d} style={{
                                  ...td, padding: '3px 1px', textAlign: 'center',
                                  backgroundColor: isScheduled ? '#16A34A' : (isDone ? '#F9FAFB' : '#fff'),
                                  color: isScheduled ? '#fff' : 'transparent',
                                  fontWeight: 700, fontSize: 10, cursor: 'default', userSelect: 'none',
                                }}>M</td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )
        })()}
        </div>
      )}

      {/* Edit modal */}
      {editingTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Edit Task</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>TASK *</label>
                <input style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.task || ''} onChange={e => setEditForm((p: any) => ({ ...p, task: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>TYPE</label>
                  <select style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                    value={editForm.frequency || 'daily'} onChange={e => setEditForm((p: any) => ({ ...p, frequency: e.target.value, tat: '' }))}>
                    {['daily','weekly','monthly'].map(f => <option key={f} value={f}>{freqLabel(f)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>PRIORITY</label>
                  <select style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                    value={editForm.priority || 'medium'} onChange={e => setEditForm((p: any) => ({ ...p, priority: e.target.value }))}>
                    {['high','medium','low'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              {editForm.frequency === 'monthly' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>DUE DATE (day of month)</label>
                  <select style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                    value={editForm.tat || ''} onChange={e => setEditForm((p: any) => ({ ...p, tat: e.target.value }))}>
                    <option value="">— Pick a day —</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}
                  </select>
                </div>
              )}
              {editForm.frequency === 'weekly' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>DUE DAY</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                      <button key={day} type="button"
                        onClick={() => {
                          const cur = (editForm.tat || '').split(',').filter(Boolean)
                          const next = cur.includes(day) ? cur.filter((d: string) => d !== day) : [...cur, day]
                          setEditForm((p: any) => ({ ...p, tat: next.join(',') }))
                        }}
                        style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                          backgroundColor: (editForm.tat || '').split(',').includes(day) ? '#111' : '#F3F4F6',
                          color: (editForm.tat || '').split(',').includes(day) ? '#fff' : '#6B7280' }}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {editForm.frequency === 'daily' && (
                <div style={{ backgroundColor: '#EFF6FF', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: '#2563EB', margin: 0 }}>Every day will be marked in the calendar ✓</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>CONTACT PERSON</label>
                  <input style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    value={editForm.contact_person || ''} onChange={e => setEditForm((p: any) => ({ ...p, contact_person: e.target.value }))} placeholder="Contact person name" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>MOBILE</label>
                  <input style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    value={editForm.mob || ''} onChange={e => setEditForm((p: any) => ({ ...p, mob: e.target.value }))} placeholder="Mobile number" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>PERSON ACCOUNTABLE</label>
                <input style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.person_accountable || ''} onChange={e => setEditForm((p: any) => ({ ...p, person_accountable: e.target.value }))} placeholder="Who is accountable" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => { deleteTemplate(editingTask.id); setEditingTask(null) }}
                style={{ padding: '8px 16px', fontSize: 13, backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Delete
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={() => setEditingTask(null)}
                style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #E5E7EB', backgroundColor: '#fff', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleEdit}
                style={{ padding: '8px 16px', fontSize: 13, backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
        {myDoneCount} of {templates.length} completed
        {freqFilter !== 'all' && ` · showing ${freqLabel(freqFilter)} tasks only`}
      </p>
    </div>
  )
}