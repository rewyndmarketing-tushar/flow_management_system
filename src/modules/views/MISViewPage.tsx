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
    ;(depts || []).forEach(d => {
      deptMap[d.id] = { id: d.id, name: d.name, total: 0, completed: 0, pending: 0 }
    })
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

  const sortedDepts = sortByPriority ? [...deptStats].sort((a, b) => b.pending - a.pending) : deptStats
  const sortedMembers = sortByPriority ? [...memberStats].sort((a, b) => (b.total - b.completed) - (a.total - a.completed)) : memberStats

  const pctColor = (pct: number) => pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">MIS View</h1>
          <p className="text-sm text-gray-500 mt-0.5">Company-wide task completion overview</p>
        </div>
        <button onClick={() => setSortByPriority(p => !p)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
            sortByPriority ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}>
          ↑ Sort by Pending
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
              filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-20 text-sm">Loading…</p>
      ) : (
        <>
          {/* Overall summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">OVERALL COMPLETION</p>
            <div className="flex items-end gap-4 mb-3">
              <p className="text-5xl font-black" style={{ color: pctColor(overallPct) }}>{overallPct}%</p>
              <div className="pb-2 flex gap-4 text-sm text-gray-400">
                <span>✓ {completedTasks} done</span>
                <span>⏳ {totalTasks - completedTasks} pending</span>
                <span>total {totalTasks}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{ width: `${overallPct}%`, backgroundColor: pctColor(overallPct) }} />
            </div>
          </div>

          {/* Department breakdown */}
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3">BY DEPARTMENT</h2>
          <div className="grid gap-3 mb-6">
            {sortedDepts.length === 0 && <p className="text-gray-400 text-sm text-center py-10">No department data</p>}
            {sortedDepts.map(d => {
              const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
              return (
                <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <p className="text-xl font-black" style={{ color: pctColor(pct) }}>{pct}%</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pctColor(pct) }} />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>✓ {d.completed} done</span>
                    <span>⏳ {d.pending} pending</span>
                    <span>total {d.total}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Member breakdown */}
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3">BY TEAM MEMBER</h2>
          <div className="grid gap-3">
            {sortedMembers.length === 0 && <p className="text-gray-400 text-sm text-center py-10">No member data</p>}
            {sortedMembers.map(m => {
              const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.role}</p>
                    </div>
                    <p className="text-xl font-black" style={{ color: pctColor(pct) }}>{pct}%</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pctColor(pct) }} />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>✓ {m.completed} done</span>
                    <span>⏳ {m.total - m.completed} pending</span>
                    <span>total {m.total}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}