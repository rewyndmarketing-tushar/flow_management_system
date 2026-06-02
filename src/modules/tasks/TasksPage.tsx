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
  const [editing, setEditing] = useState<Task | null>(null)
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

  function openEdit(t: Task) {
    setEditing(t)
    setForm({
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      department_id: t.department?.id || '',
      assigned_to: (t.assigned as any)?.id || '',
      tat: (t as any).tat || '',
      sub_category: (t as any).sub_category || '',
    })
    setModal(true)
  }

  async function save() {
    if (!form.title?.trim()) return alert('Task name required')
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      type: form.type,
      priority: form.priority,
      department_id: form.department_id || null,
      assigned_to: form.assigned_to || null,
      tat: form.tat || null,
      sub_category: form.sub_category || null,

    }
    if (editing) {
      await supabase.from('tasks').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('tasks').insert({ ...payload, is_active: true })
    }
    setSaving(false)
    setModal(false)
    setEditing(null)
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
          <button onClick={() => { setEditing(null); setForm({ type: 'daily', priority: 'medium' }); setModal(true) }}
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
                    <button onClick={() => openEdit(t)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                      Edit
                    </button>
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Edit Task' : 'Add New Task'}</h2>
            <div className="flex flex-col gap-4">

              {/* 1. Department */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.department_id || ''} onChange={e => setForm((p: any) => ({ ...p, department_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* 2. Assign To */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign To</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.assigned_to || ''} onChange={e => setForm((p: any) => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">— Unassigned —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {/* 3. Task Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task *</label>
                <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.title || ''} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. CCTV check, Electricity bill" />
              </div>

              {/* 4. Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 h-16 resize-none"
                  value={form.description || ''} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>

              {/* 5. Type + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                  <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value, tat: '' }))}>
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

              {/* 6. Sub Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub Category</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.sub_category || ''} onChange={e => setForm((p: any) => ({ ...p, sub_category: e.target.value }))}>
                  <option value="">— None —</option>
                  <option value="Office Maintenance">Office Maintenance</option>
                  <option value="Security & Reception">Security & Reception</option>
                  <option value="Factory Floor Up Keep">Factory Floor Up Keep</option>
                  <option value="Courier Sending & Tracking">Courier Sending & Tracking</option>
                </select>
              </div>

              {/* 6. Due Date — dynamic by type */}
              {form.type === 'daily' && (
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-600 font-medium">Every day will be marked in the calendar ✓</p>
                </div>
              )}

              {form.type === 'weekly' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Day (pick one or more)</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                      <button key={day} type="button"
                        onClick={() => {
                          const current = (form.tat || '').split(',').filter(Boolean)
                          const next = current.includes(day)
                            ? current.filter((d: string) => d !== day)
                            : [...current, day]
                          setForm((p: any) => ({ ...p, tat: next.join(',') }))
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          (form.tat || '').split(',').includes(day)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'monthly' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date (day of month)</label>
                  <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.tat || ''} onChange={e => setForm((p: any) => ({ ...p, tat: e.target.value }))}>
                    <option value="">— Pick a day —</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModal(false); setEditing(null) }}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Update Task' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}