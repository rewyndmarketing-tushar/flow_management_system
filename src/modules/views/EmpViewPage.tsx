import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Member = { id: string; name: string; role: string }
type Task = { id: string; title: string; type: string; priority: string }

const FILTERS = ['Today', 'Weekly', 'Monthly', 'Yearly']
const PRIORITY_COLOR: Record<string, string> = { high: '#DC2626', medium: '#D97706', low: '#16A34A' }
const TYPE_COLOR: Record<string, string> = { daily: '#1D4ED8', weekly: '#7C3AED', monthly: '#15803D' }
const ROLE_COLOR: Record<string, string> = {
  owner: '#3C3489', mis: '#26215C', crm: '#993C1D',
  'pc-purchase': '#E65100', 'pc-finance': '#854F0B',
  'pc-production': '#185FA5', 'pc-dispatch': '#4527A0',
}

export default function EmpViewPage() {
  const [filter, setFilter] = useState('Today')
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sortByPriority, setSortByPriority] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => { fetchMembers() }, [])
  useEffect(() => { if (selectedMember) fetchTasks(selectedMember.id) }, [selectedMember, filter])

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('id,name,role').eq('is_active', true).order('name')
    setMembers(data || [])
    if (data && data.length > 0) setSelectedMember(data[0])
    setLoading(false)
  }

  function getDateRange() {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (filter === 'Today') return { from: today, to: today }
    if (filter === 'Weekly') {
      const from = new Date(now); from.setDate(now.getDate() - 7)
      return { from: from.toISOString().split('T')[0], to: today }
    }
    if (filter === 'Monthly') {
      const from = new Date(now); from.setDate(now.getDate() - 30)
      return { from: from.toISOString().split('T')[0], to: today }
    }
    const from = new Date(now); from.setFullYear(now.getFullYear() - 1)
    return { from: from.toISOString().split('T')[0], to: today }
  }

  async function fetchTasks(memberId: string) {
    setLoading(true)
    const { from, to } = getDateRange()
    const [{ data: taskData }, { data: completions }] = await Promise.all([
      supabase.from('tasks').select('id,title,type,priority')
        .eq('assigned_to', memberId).eq('is_active', true),
      supabase.from('task_completions').select('task_id')
        .eq('completed_by', memberId).gte('date', from).lte('date', to),
    ])
    setTasks(taskData || [])
    setCompletedIds(new Set((completions || []).map(c => c.task_id)))
    setLoading(false)
  }

  const completed = tasks.filter(t => completedIds.has(t.id))
  const pending = tasks.filter(t => !completedIds.has(t.id))
  const pct = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0
  const pctColor = (p: number) => p >= 80 ? '#16A34A' : p >= 50 ? '#D97706' : '#DC2626'
  const pctBg = (p: number) => p >= 80 ? '#F0FDF4' : p >= 50 ? '#FFFBEB' : '#FEF2F2'
  const roleColor = ROLE_COLOR[selectedMember?.role || ''] || '#555'

  const sortedPending = sortByPriority
    ? [...pending].sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
      })
    : pending

  const displayTasks = showCompleted ? [...sortedPending, ...completed] : sortedPending

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>Employee View</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>Task completion by team member</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              backgroundColor: filter === f ? '#111' : '#fff',
              borderColor: filter === f ? '#111' : '#E5E7EB',
              color: filter === f ? '#fff' : '#555',
            }}>{f}</button>
          ))}
          <button onClick={() => setSortByPriority(p => !p)} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', border: '1px solid',
            backgroundColor: sortByPriority ? '#8B1A1A' : '#fff',
            borderColor: sortByPriority ? '#8B1A1A' : '#E5E7EB',
            color: sortByPriority ? '#fff' : '#555',
          }}>↑ Priority</button>
        </div>
      </div>

      {/* Member tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E5E7EB', overflowX: 'auto' }}>
        {members.map(m => {
          const color = ROLE_COLOR[m.role] || '#555'
          const isSelected = selectedMember?.id === m.id
          return (
            <button key={m.id} onClick={() => setSelectedMember(m)} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: isSelected ? `2px solid ${color}` : '2px solid transparent',
              color: isSelected ? color : '#9CA3AF',
              marginBottom: -1,
            }}>
              {m.name}
              <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>{m.role}</span>
            </button>
          )
        })}
      </div>

      {/* Member info + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{
          backgroundColor: roleColor + '12', borderRadius: 8, padding: '12px 16px',
          border: `1px solid ${roleColor}30`, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18, flexShrink: 0,
            backgroundColor: roleColor + '22', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, fontWeight: 800, color: roleColor,
          }}>{selectedMember?.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>{selectedMember?.name}</p>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3, backgroundColor: roleColor + '22', color: roleColor }}>{selectedMember?.role}</span>
          </div>
        </div>
        {[
          { label: 'Total', value: tasks.length, color: '#374151', bg: '#F9FAFB' },
          { label: 'Completed', value: completed.length, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Pending', value: pending.length, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Rate', value: `${pct}%`, color: pctColor(pct), bg: pctBg(pct) },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: s.bg, borderRadius: 8, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E5E7EB',
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, backgroundColor: pctColor(pct), transition: 'width 0.3s' }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 100px 100px 80px',
            backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
            padding: '10px 16px', gap: 12,
          }}>
            {['Task', 'Type', 'Priority', 'Status'].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{h}</p>
            ))}
          </div>

          {displayTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>No tasks assigned to this member</p>
            </div>
          ) : displayTasks.map((t, i) => {
            const isDone = completedIds.has(t.id)
            return (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 100px 100px 80px',
                padding: '12px 16px', gap: 12, alignItems: 'center',
                borderBottom: i < displayTasks.length - 1 ? '1px solid #F3F4F6' : 'none',
                backgroundColor: isDone ? '#FAFAFA' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                opacity: isDone ? 0.6 : 1,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#9CA3AF' : '#111', margin: 0, textDecoration: isDone ? 'line-through' : 'none' }}>
                  {isDone ? '✓ ' : ''}{t.title}
                </p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: (TYPE_COLOR[t.type] || '#555') + '18', color: TYPE_COLOR[t.type] || '#555', width: 'fit-content' }}>
                  {t.type}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: (PRIORITY_COLOR[t.priority] || '#555') + '18', color: PRIORITY_COLOR[t.priority] || '#555', width: 'fit-content' }}>
                  {t.priority}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: isDone ? '#DCFCE7' : '#FEF9C3', color: isDone ? '#16A34A' : '#CA8A04', width: 'fit-content' }}>
                  {isDone ? 'Done' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
          {pending.length} pending · {completed.length} completed
        </p>
        <button onClick={() => setShowCompleted(p => !p)} style={{
          fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer',
        }}>
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </button>
      </div>
    </div>
  )
}