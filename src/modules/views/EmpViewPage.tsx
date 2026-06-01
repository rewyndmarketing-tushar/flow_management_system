import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Member = { id: string; name: string; role: string }
type Task = { id: string; title: string; type: string; priority: string }

const FILTERS = ['Today', 'Weekly', 'Monthly', 'Yearly']
const PRIORITY_COLOR: Record<string, string> = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
const TYPE_COLOR: Record<string, string> = { daily: '#1565C0', weekly: '#6A1B9A', monthly: '#2E7D32' }
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
  const pctColor = (p: number) => p >= 80 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626'
  const roleColor = ROLE_COLOR[selectedMember?.role || ''] || '#555'

  const sortedPending = sortByPriority
    ? [...pending].sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
      })
    : pending

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employee View</h1>
          <p className="text-sm text-gray-500 mt-0.5">Task completion by team member</p>
        </div>
        <button onClick={() => setSortByPriority(p => !p)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
            sortByPriority ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}>
          ↑ Sort by Priority
        </button>
      </div>

      {/* Member selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {members.map(m => {
          const color = ROLE_COLOR[m.role] || '#555'
          const isSelected = selectedMember?.id === m.id
          return (
            <button key={m.id} onClick={() => setSelectedMember(m)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border transition"
              style={{
                backgroundColor: isSelected ? color + '18' : '#fff',
                borderColor: isSelected ? color : '#e5e7eb',
                color: isSelected ? color : '#6b7280',
              }}>
              {m.name}
              <span className="ml-1.5 text-xs opacity-60">{m.role}</span>
            </button>
          )
        })}
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

      {loading ? <p className="text-center text-gray-400 py-20 text-sm">Loading…</p> : (
        <>
          {/* Summary */}
          <div className="bg-white rounded-2xl border p-6 mb-6" style={{ borderColor: roleColor + '44' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                style={{ backgroundColor: roleColor + '18', color: roleColor }}>
                {selectedMember?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedMember?.name}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: roleColor + '18', color: roleColor }}>
                  {selectedMember?.role}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <p className="text-5xl font-black" style={{ color: pctColor(pct) }}>{pct}%</p>
              <div className="pb-2 flex gap-4 text-sm text-gray-400">
                <span>✓ {completed.length} done</span>
                <span>⏳ {pending.length} pending</span>
                <span>total {tasks.length}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pctColor(pct) }} />
            </div>
          </div>

          {/* Pending */}
          {sortedPending.length > 0 && (
            <>
              <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3">PENDING</h2>
              <div className="grid gap-3 mb-6">
                {sortedPending.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{t.title}</p>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: (PRIORITY_COLOR[t.priority] || '#555') + '18', color: PRIORITY_COLOR[t.priority] || '#555' }}>
                        {t.priority}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: (TYPE_COLOR[t.type] || '#555') + '18', color: TYPE_COLOR[t.type] || '#555' }}>
                      {t.type}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <>
              <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3">COMPLETED</h2>
              <div className="grid gap-3">
                {completed.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 opacity-50">
                    <p className="text-sm text-gray-500 line-through">✓ {t.title}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {tasks.length === 0 && <p className="text-center text-gray-400 py-20 text-sm">No tasks assigned</p>}
        </>
      )}
    </div>
  )
}