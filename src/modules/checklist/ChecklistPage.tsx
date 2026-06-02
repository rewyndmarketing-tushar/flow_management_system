import { useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type FreqColor = '#D97706' | '#DC2626' | '#2563EB' | '#7C3AED' | '#059669'

interface Task {
  id: string
  dept: string
  task: string
  freq: string
  freqColor: FreqColor
  lastDone?: string
  dueDates?: string
  contact?: string
  mob?: string
  accountable?: string
  markedDays: Record<number, boolean>   // day-of-month → done
}

// ── Seed data (mirrors your Excel screenshot) ────────────────────────────────

const SEED: Task[] = [
  { id: 'a1',  dept: 'Admin',      task: 'A/C Maintenance (Company)',  freq: 'Monthly',      freqColor: '#D97706', dueDates: '12TH APR',                    markedDays: { 12: true } },
  { id: 'a2',  dept: 'Admin',      task: 'A/C Filter (Company)',       freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '12 JUN,SEP,DEC,MAR',          markedDays: {} },
  { id: 'a3',  dept: 'Admin',      task: 'ELECTRICITY',                freq: 'Monthly',      freqColor: '#D97706', dueDates: '2nd',                          markedDays: { 2: true } },
  { id: 'a4',  dept: 'Admin',      task: 'UPS Office (AMC)',           freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '30th MAR,JUN,SEP,DEC',        markedDays: {} },
  { id: 'a5',  dept: 'Admin',      task: 'UPS BATTERIES',              freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '9th DEC,MAR,JUN,SEP',         markedDays: {} },
  { id: 'a6',  dept: 'Admin',      task: 'Generator Diesel',           freq: 'Weekly',       freqColor: '#DC2626', dueDates: '',                             markedDays: {} },
  { id: 'a7',  dept: 'Admin',      task: 'Water Tank (Home)',          freq: 'Half Yrly',    freqColor: '#7C3AED', dueDates: '05th APR,NOV',                markedDays: { 5: true } },
  { id: 'a8',  dept: 'Admin',      task: 'R/O (Home)',                 freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '22th MAR,JUN,SEP,DEC',        markedDays: {} },
  { id: 'a9',  dept: 'Admin',      task: 'Update Intercom list',       freq: 'Monthly',      freqColor: '#D97706', dueDates: '30th',                         markedDays: {} },
  { id: 'a10', dept: 'Admin',      task: 'Car servicing',              freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '',                             markedDays: {} },
  { id: 'm1',  dept: 'Maint.',     task: 'Ceiling Fan',                freq: 'Fortnightly',  freqColor: '#059669', dueDates: '15,30',                        markedDays: {} },
  { id: 'm2',  dept: 'Maint.',     task: 'Tube Lights',                freq: 'Fortnightly',  freqColor: '#059669', dueDates: '15,30',                        markedDays: {} },
  { id: 'm3',  dept: 'Maint.',     task: 'Exhaust Fan',                freq: 'Fortnightly',  freqColor: '#059669', dueDates: '15,30',                        markedDays: {} },
  { id: 's1',  dept: 'Security',   task: 'Fire Extinguisher',          freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '26th JAN,APR,JUL,OCT',        markedDays: {} },
  { id: 's2',  dept: 'Security',   task: 'Fire Alarm',                 freq: 'Monthly',      freqColor: '#D97706', dueDates: '2nd',                          markedDays: { 2: true } },
  { id: 's3',  dept: 'Security',   task: 'Emergency Light',            freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '',                             markedDays: {} },
  { id: 's4',  dept: 'Security',   task: 'First Aid Box',              freq: 'Monthly',      freqColor: '#D97706', dueDates: '10th',                         markedDays: { 10: true } },
  { id: 'p1',  dept: 'Prod',       task: 'Machine 1',                  freq: 'Fortnightly',  freqColor: '#059669', dueDates: '15,30',                        markedDays: {} },
  { id: 'p2',  dept: 'Prod',       task: 'Machine 2',                  freq: 'Fortnightly',  freqColor: '#059669', dueDates: '15,31',                        markedDays: {} },
  { id: 'hr1', dept: 'HR',         task: 'Attendance Review',          freq: 'Monthly',      freqColor: '#D97706', dueDates: '1st',                          markedDays: {} },
  { id: 'f1',  dept: 'Finance',    task: 'GST Filing',                 freq: 'Monthly',      freqColor: '#D97706', dueDates: '20th',                         markedDays: {} },
  { id: 'f2',  dept: 'Finance',    task: 'TDS Payment',                freq: 'Monthly',      freqColor: '#D97706', dueDates: '7th',                          markedDays: {} },
  { id: 'pu1', dept: 'Purchase',   task: 'Vendor Review',              freq: 'Quarterly',    freqColor: '#2563EB', dueDates: '1st JAN,APR,JUL,OCT',         markedDays: {} },
  { id: 'sa1', dept: 'Sales',      task: 'Target Review',              freq: 'Monthly',      freqColor: '#D97706', dueDates: '1st',                          markedDays: {} },
  { id: 'di1', dept: 'Dispatch',   task: 'Vehicle Check',              freq: 'Weekly',       freqColor: '#DC2626', dueDates: '',                             markedDays: {} },
]

const DEPTS = ['Admin', 'Maint.', 'Security', 'Prod', 'HR', 'Finance', 'Purchase', 'Sales', 'Dispatch']

// ── Calendar helpers ──────────────────────────────────────────────────────────

const now    = new Date()
const MONTH  = now.toLocaleString('default', { month: 'long', year: 'numeric' })
const DAYS_IN_MONTH = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
const ALL_DAYS = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1)

// Group days into weeks (Mon-Sun) starting from day 1
function buildWeeks(days: number[], year: number, month: number) {
  const weeks: number[][] = []
  let week: number[] = []
  days.forEach(d => {
    week.push(d)
    const dow = new Date(year, month, d).getDay()   // 0=Sun
    if (dow === 0 || d === days[days.length - 1]) { weeks.push(week); week = [] }
  })
  return weeks
}
const WEEKS = buildWeeks(ALL_DAYS, now.getFullYear(), now.getMonth())

// ── Row background by dept ────────────────────────────────────────────────────

const DEPT_BG: Record<string, string> = {
  'Admin':    '#f0ede0',
  'Maint.':   '#fdf3e7',
  'Security': '#e8eef6',
  'Prod':     '#f0ede0',
  'HR':       '#e8f4ec',
  'Finance':  '#f0ede0',
  'Purchase': '#e8eef6',
  'Sales':    '#fdf3e7',
  'Dispatch': '#f0ede0',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeptChecklistPage() {
  const [activeDept, setActiveDept] = useState('Admin')
  const [tasks, setTasks]           = useState<Task[]>(SEED)
  const [showAdd, setShowAdd]       = useState(false)
  const [newTask, setNewTask]       = useState({ task: '', freq: 'Monthly', dueDates: '', contact: '', mob: '', accountable: '' })

  const filtered = tasks.filter(t => t.dept === activeDept)
  const doneCount = filtered.filter(t => Object.values(t.markedDays).some(Boolean)).length

  function toggleDay(taskId: string, day: number) {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, markedDays: { ...t.markedDays, [day]: !t.markedDays[day] } } : t
    ))
  }

  function addTask() {
    if (!newTask.task.trim()) return
    const t: Task = {
      id: `${activeDept}-${Date.now()}`,
      dept: activeDept,
      task: newTask.task,
      freq: newTask.freq,
      freqColor: newTask.freq === 'Weekly' ? '#DC2626' : newTask.freq === 'Monthly' ? '#D97706' : newTask.freq === 'Fortnightly' ? '#059669' : newTask.freq === 'Half Yrly' ? '#7C3AED' : '#2563EB',
      dueDates: newTask.dueDates,
      contact: newTask.contact,
      mob: newTask.mob,
      accountable: newTask.accountable,
      markedDays: {},
    }
    setTasks(prev => [...prev, t])
    setNewTask({ task: '', freq: 'Monthly', dueDates: '', contact: '', mob: '', accountable: '' })
    setShowAdd(false)
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const cell: React.CSSProperties = {
    border: '1px solid #c8c4a8',
    padding: '4px 6px',
    fontSize: 11,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  }
  const hdr: React.CSSProperties = {
    ...cell,
    backgroundColor: '#d6d2b8',
    fontWeight: 700,
    fontSize: 11,
    textAlign: 'center',
    color: '#333',
  }
  const dayCell: React.CSSProperties = {
    border: '1px solid #c8c4a8',
    width: 26,
    minWidth: 26,
    textAlign: 'center',
    fontSize: 11,
    padding: '3px 0',
    cursor: 'pointer',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111' }}>Department Checklist</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Shared checklist for your team</p>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          + Add Task
        </button>
      </div>

      {/* Add-task form */}
      {showAdd && (
        <div style={{ background: '#f9fafb', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          {[
            { label: 'Task *', key: 'task', width: 200 },
            { label: 'Due Dates', key: 'dueDates', width: 140 },
            { label: 'Contact Person', key: 'contact', width: 120 },
            { label: 'Mob', key: 'mob', width: 110 },
            { label: 'Accountable', key: 'accountable', width: 120 },
          ].map(f => (
            <div key={f.key}>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 3px' }}>{f.label}</p>
              <input
                value={(newTask as any)[f.key]}
                onChange={e => setNewTask(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: f.width, padding: '5px 8px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 4 }}
              />
            </div>
          ))}
          <div>
            <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 3px' }}>Frequency</p>
            <select value={newTask.freq} onChange={e => setNewTask(p => ({ ...p, freq: e.target.value }))}
              style={{ padding: '5px 8px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 4 }}>
              {['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yrly', 'Yearly'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <button onClick={addTask} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Save</button>
          <button onClick={() => setShowAdd(false)} style={{ padding: '6px 14px', fontSize: 12, backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: 5, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Dept tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB', marginBottom: 16, overflowX: 'auto' }}>
        {DEPTS.map(d => (
          <button key={d} onClick={() => setActiveDept(d)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: activeDept === d ? '2px solid #111' : '2px solid transparent',
            color: activeDept === d ? '#111' : '#9CA3AF',
            marginBottom: -1, whiteSpace: 'nowrap',
          }}>{d}</button>
        ))}
      </div>

      {/* Progress */}
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{doneCount} of {filtered.length} tasks with activity this month</p>

      {/* Main scrollable table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <p style={{ fontSize: 14 }}>No tasks for this department yet.</p>
          <p style={{ fontSize: 12 }}>Click "+ Add Task" to get started.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 6 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <thead>
              {/* Month + week group header */}
              <tr>
                {/* Fixed left cols */}
                <th style={{ ...hdr, width: 55 }}>Dept.</th>
                <th style={{ ...hdr, width: 160 }}>Task</th>
                <th style={{ ...hdr, width: 76, color: '#DC2626' }}>Freq.</th>
                <th style={{ ...hdr, width: 58 }}>Last Done</th>
                <th style={{ ...hdr, width: 150, color: '#DC2626' }}>Due Dates</th>
                <th style={{ ...hdr, width: 80 }}>Contact Person</th>
                <th style={{ ...hdr, width: 58 }}>Mob</th>
                <th style={{ ...hdr, width: 70 }}>Person Accountable</th>

                {/* Month label spanning all day cols */}
                <th
                  colSpan={ALL_DAYS.length}
                  style={{ ...hdr, backgroundColor: '#b8d4e8', color: '#111', textAlign: 'center' }}
                >
                  {MONTH}
                </th>
              </tr>

              {/* Week group row */}
              <tr>
                <th style={hdr} colSpan={8} />
                {WEEKS.map((wk, wi) => (
                  <th
                    key={wi}
                    colSpan={wk.length}
                    style={{ ...hdr, backgroundColor: '#cce0ee', color: '#111', textAlign: 'center' }}
                  >
                    Week {wi + 1}
                  </th>
                ))}
              </tr>

              {/* Day numbers row */}
              <tr>
                <th style={hdr} colSpan={8} />
                {ALL_DAYS.map(d => (
                  <th key={d} style={{ ...hdr, width: 26, minWidth: 26, padding: '3px 0', textAlign: 'center' }}>{d}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((t, i) => {
                const bg = DEPT_BG[t.dept] ?? '#f9f6ea'
                const prevDept = i > 0 ? filtered[i - 1].dept : null
                const topBorder = prevDept !== t.dept ? '2px solid #a8a48c' : undefined
                return (
                  <tr key={t.id} style={{ backgroundColor: bg }}>
                    <td style={{ ...cell, borderTop: topBorder, fontWeight: 600, color: '#444' }}>{t.dept}</td>
                    <td style={{ ...cell, borderTop: topBorder, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.task}>{t.task}</td>
                    <td style={{ ...cell, borderTop: topBorder, color: t.freqColor, textAlign: 'center', fontWeight: 500 }}>{t.freq}</td>
                    <td style={{ ...cell, borderTop: topBorder, textAlign: 'center', color: '#555' }}>{t.lastDone ?? ''}</td>
                    <td style={{ ...cell, borderTop: topBorder, color: '#DC2626', textAlign: 'center' }}>{t.dueDates}</td>
                    <td style={{ ...cell, borderTop: topBorder, color: '#444' }}>{t.contact ?? ''}</td>
                    <td style={{ ...cell, borderTop: topBorder, color: '#444' }}>{t.mob ?? ''}</td>
                    <td style={{ ...cell, borderTop: topBorder, color: '#444' }}>{t.accountable ?? ''}</td>

                    {/* Day cells */}
                    {ALL_DAYS.map(d => {
                      const done = !!t.markedDays[d]
                      return (
                        <td
                          key={d}
                          style={{
                            ...dayCell,
                            borderTop: topBorder,
                            backgroundColor: done ? '#16A34A' : bg,
                            color: done ? '#fff' : 'transparent',
                            fontWeight: 700,
                          }}
                          onClick={() => toggleDay(t.id, d)}
                          title={`Mark day ${d}`}
                        >
                          {done ? 'M' : '·'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
        Click any day cell to mark it done (green M). Click again to unmark.
      </p>
    </div>
  )
}