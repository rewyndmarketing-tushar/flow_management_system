import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'


type DeptStat = { id: string; name: string; total: number; completed: number; pending: number }
type MemberStat = { id: string; name: string; role: string; total: number; completed: number }

const FILTERS = ['Today', 'Weekly', 'Monthly', 'Yearly']

export default function MISViewPage() {
  const [filter, setFilter] = useState('Today')
  const [sortByPriority, setSortByPriority] = useState(false)
  const [deptStats, setDeptStats] = useState<DeptStat[]>([])
  const [memberStats, setMemberStats] = useState<MemberStat[]>([])
  const [totalTasks, setTotalTasks] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dept' | 'member'>('dept')

  useEffect(() => { fetchStats() }, [filter])

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

  async function fetchStats() {
    setLoading(true)
    const { from, to } = getDateRange()
    const [{ data: tasks }, { data: completions }, { data: depts }, { data: members }] = await Promise.all([
      supabase.from('tasks').select('id, department_id, assigned_to').eq('is_active', true),
      supabase.from('task_completions').select('task_id, completed_by').gte('date', from).lte('date', to),
      supabase.from('departments').select('id, name').eq('is_active', true),
      supabase.from('profiles').select('id, name, role').eq('is_active', true),
    ])

    const completedIds = new Set((completions || []).map(c => c.task_id))
    const completedByMember: Record<string, number> = {}
    ;(completions || []).forEach(c => {
      if (c.completed_by) completedByMember[c.completed_by] = (completedByMember[c.completed_by] || 0) + 1
    })

    const deptMap: Record<string, DeptStat> = {}
    ;(depts || []).forEach(d => { deptMap[d.id] = { id: d.id, name: d.name, total: 0, completed: 0, pending: 0 } })
    ;(tasks || []).forEach(t => {
      if (t.department_id && deptMap[t.department_id]) {
        deptMap[t.department_id].total++
        if (completedIds.has(t.id)) deptMap[t.department_id].completed++
        else deptMap[t.department_id].pending++
      }
    })
    setDeptStats(Object.values(deptMap).filter(d => d.total > 0))

    const memberList = (members || []).map(m => ({
      id: m.id, name: m.name, role: m.role,
      total: (tasks || []).filter(t => t.assigned_to === m.id).length,
      completed: completedByMember[m.id] || 0,
    })).filter(m => m.total > 0)
    setMemberStats(memberList)
    setTotalTasks(tasks?.length || 0)
    setCompletedTasks(completedIds.size)
    setLoading(false)
  }

  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const pctColor = (p: number) => p >= 80 ? '#16A34A' : p >= 50 ? '#D97706' : '#DC2626'
  const pctBg = (p: number) => p >= 80 ? '#DCFCE7' : p >= 50 ? '#FEF9C3' : '#FEE2E2'

  const sortedDepts = sortByPriority ? [...deptStats].sort((a, b) => b.pending - a.pending) : deptStats
  const sortedMembers = sortByPriority ? [...memberStats].sort((a, b) => (b.total - b.completed) - (a.total - a.completed)) : memberStats

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>MIS View</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>Company-wide task completion overview</p>
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
          }}>↑ Pending First</button>
        </div>
      </div>

      {/* Overall stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Tasks', value: totalTasks, color: '#374151', bg: '#F9FAFB' },
          { label: 'Completed', value: completedTasks, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Pending', value: totalTasks - completedTasks, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Completion Rate', value: `${overallPct}%`, color: pctColor(overallPct), bg: pctBg(overallPct) },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: s.bg, borderRadius: 8, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid #E5E7EB',
          }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
        {[{ key: 'dept', label: 'By Department' }, { key: 'member', label: 'By Team Member' }].map(v => (
          <button key={v.key} onClick={() => setView(v.key as any)} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: view === v.key ? '2px solid #111' : '2px solid transparent',
            color: view === v.key ? '#111' : '#9CA3AF',
            marginBottom: -1,
          }}>{v.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: view === 'dept' ? '2fr 80px 80px 80px 140px' : '2fr 100px 80px 80px 80px 140px',
            backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
            padding: '10px 16px', gap: 12,
          }}>
            {(view === 'dept'
              ? ['Department', 'Total', 'Done', 'Pending', 'Completion']
              : ['Member', 'Role', 'Total', 'Done', 'Pending', 'Completion']
            ).map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{h}</p>
            ))}
          </div>

          {/* Dept rows */}
          {view === 'dept' && (
            sortedDepts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>No department data for this period</p>
              </div>
            ) : sortedDepts.map((d, i) => {
              const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
              return (
                <div key={d.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 140px',
                  padding: '12px 16px', gap: 12, alignItems: 'center',
                  borderBottom: i < sortedDepts.length - 1 ? '1px solid #F3F4F6' : 'none',
                  backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{d.name}</p>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{d.total}</p>
                  <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, margin: 0 }}>{d.completed}</p>
                  <p style={{ fontSize: 13, color: '#D97706', fontWeight: 600, margin: 0 }}>{d.pending}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: pctColor(pct), transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(pct), minWidth: 32 }}>{pct}%</span>
                  </div>
                </div>
              )
            })
          )}

          {/* Member rows */}
          {view === 'member' && (
            sortedMembers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>No member data for this period</p>
              </div>
            ) : sortedMembers.map((m, i) => {
              const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0
              return (
                <div key={m.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 100px 80px 80px 80px 140px',
                  padding: '12px 16px', gap: 12, alignItems: 'center',
                  borderBottom: i < sortedMembers.length - 1 ? '1px solid #F3F4F6' : 'none',
                  backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{m.name}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: '#F3F4F6', color: '#374151', width: 'fit-content' }}>{m.role}</span>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{m.total}</p>
                  <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, margin: 0 }}>{m.completed}</p>
                  <p style={{ fontSize: 13, color: '#D97706', fontWeight: 600, margin: 0 }}>{m.total - m.completed}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: pctColor(pct), transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(pct), minWidth: 32 }}>{pct}%</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
        {view === 'dept' ? `${sortedDepts.length} departments` : `${sortedMembers.length} members`}
      </p>
    </div>
  )
}