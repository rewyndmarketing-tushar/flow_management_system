import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../components/Layout'

type Task = {
  id: string
  title: string
  description: string
  type: string
  priority: string
  is_active: boolean
  department: { id: string; name: string } | null
  assigned: { id: string; name: string } | null
}

type Dept = { id: string; name: string }
type Member = { id: string; name: string }

const PRIORITY_COLOR: Record<string, string> = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
const TYPE_COLOR: Record<string, string> = { daily: '#1565C0', weekly: '#6A1B9A', monthly: '#2E7D32' }

export default function TasksPage() {
  const profile = useProfile()
  const isManager = ['owner', 'ea', 'mis'].includes(profile.role)
  const [tasks, setTasks] = useState<Task[]>([])
  const [depts, setDepts] = useState<Dept[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>({ type: 'daily', priority: 'medium', is_active: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [filter])

  async function fetchAll() {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*, department:departments(id,name), assigned:profiles!tasks_assigned_to_fkey(id,name)')
      .order('created_at', { ascending: false })
    if (!isManager) query = query.eq('assigned_to', profile.user_id)
    if (filter !== 'all') query = query.eq('type', filter)
    const { data } = await query
    setTasks(data || [])

    const [{ data: d }, { data: m }] = await Promise.all([
      supabase.from('departments').select('id,name').eq('is_active', true).order('name'),
      supabase.from('profiles').select('id,name').eq('is_active', true).order('name'),
    ])
    setDepts(d || [])
    setMembers(m || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title?.trim()) return alert('Title required')
    setSaving(true)
    await supabase.from('tasks').insert({
      title: form.title.trim(),
      description: form.description?.trim() || '',
      type: form.type,
      priority: form.priority,
      department_id: form.department_id || null,
      assigned_to: form.assigned_to || null,
      is_active: true,
    })
    setSaving(false)
    setModal(false)
    setForm({ type: 'daily', priority: 'medium' })
    fetchAll()
  }

  async function toggleActive(t: Task) {
    await supabase.from('tasks').update({ is_active: !t.is_active }).eq('id', t.id)
    fetchAll()
  }

  async function deleteTask(id: string) {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchAll()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and assign tasks across the organisation</p>
        </div>
        {isManager && (
          <button onClick={() => setModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
            + Add Task
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'daily', 'weekly', 'monthly'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
              filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-20 text-sm">Loading…</p>
      ) : (
        <div className="grid gap-3">
          {tasks.length === 0 && (
            <p className="text-center text-gray-400 py-20 text-sm">
              No tasks found. {isManager ? 'Click + Add Task to create one.' : ''}
            </p>
          )}
          {tasks.map(t => (
            <div key={t.id} className={`bg-white rounded-xl border border-gray-200 p-4 ${!t.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{t.title}</p>
                  {t.description && <p className="text-sm text-gray-400 mb-2">{t.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: (TYPE_COLOR[t.type] || '#555') + '18', color: TYPE_COLOR[t.type] || '#555' }}>
                      {t.type}
                    </span>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: (PRIORITY_COLOR[t.priority] || '#555') + '18', color: PRIORITY_COLOR[t.priority] || '#555' }}>
                      {t.priority}
                    </span>
                    {t.department && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                        {t.department.name}
                      </span>
                    )}
                    {t.assigned && (
                      <span className="text-xs text-gray-400">👤 {t.assigned.name}</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {isManager && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(t)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                        t.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}>
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteTask(t.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Task</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
                <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.title || ''} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Update job status board" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 h-16 resize-none"
                  value={form.description || ''} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                  <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</label>
                  <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.priority} onChange={e => setForm((p: any) => ({ ...p, priority: e.target.value }))}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.department_id || ''} onChange={e => setForm((p: any) => ({ ...p, department_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign To</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.assigned_to || ''} onChange={e => setForm((p: any) => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">— Unassigned —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}