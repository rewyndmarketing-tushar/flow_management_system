import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Dept = { id: string; name: string; description: string; is_active: boolean }
type Process = { id: string; name: string; description: string; is_active: boolean; department_id: string; department?: { name: string } }
type Member = { id: string; name: string; role: string; email: string; is_active: boolean; department_id: string; department?: { name: string } }

const ROLES = ['owner', 'mis', 'crm', 'pc-purchase', 'pc-finance', 'pc-production', 'pc-dispatch']
const ROLE_COLORS: Record<string, string> = {
  owner: '#3C3489', mis: '#26215C', crm: '#993C1D',
  'pc-purchase': '#E65100', 'pc-finance': '#854F0B',
  'pc-production': '#185FA5', 'pc-dispatch': '#185FA5',
}

type Tab = 'departments' | 'processes' | 'team'

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>('departments')
  const [depts, setDepts] = useState<Dept[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modal, setModal] = useState<{ type: Tab | null; data?: any }>({ type: null })
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: d }, { data: p }, { data: m }] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('processes').select('*, department:departments(name)').order('name'),
      supabase.from('profiles').select('*, department:departments(name)').order('name'),
    ])
    setDepts(d || [])
    setProcesses(p || [])
    setMembers(m || [])
    setLoading(false)
  }

  function openModal(type: Tab, data?: any) {
    setModal({ type, data })
    if (data) setForm({ ...data })
    else setForm({ is_active: true, department_id: depts[0]?.id || '' })
  }

  function closeModal() { setModal({ type: null }); setForm({}) }

  async function save() {
    setSaving(true)
    if (modal.type === 'departments') {
      if (modal.data) await supabase.from('departments').update({ name: form.name, description: form.description }).eq('id', modal.data.id)
      else await supabase.from('departments').insert({ name: form.name, description: form.description, is_active: true })
    }
    if (modal.type === 'processes') {
      if (modal.data) await supabase.from('processes').update({ name: form.name, description: form.description, department_id: form.department_id }).eq('id', modal.data.id)
      else await supabase.from('processes').insert({ name: form.name, description: form.description, department_id: form.department_id, is_active: true })
    }
    if (modal.type === 'team') {
      await supabase.from('profiles').update({ name: form.name, role: form.role, department_id: form.department_id || null }).eq('id', modal.data.id)
    }
    setSaving(false)
    closeModal()
    fetchAll()
  }

  async function toggleActive(table: string, id: string, current: boolean) {
    await supabase.from(table).update({ is_active: !current }).eq('id', id)
    fetchAll()
  }

  async function deleteDept(id: string) {
    if (!window.confirm('Delete this department?')) return
    await supabase.from('departments').delete().eq('id', id)
    fetchAll()
  }

  async function deleteProcess(id: string) {
    if (!window.confirm('Delete this process?')) return
    await supabase.from('processes').delete().eq('id', id)
    fetchAll()
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'departments', label: 'Departments', count: depts.length },
    { key: 'processes', label: 'Processes', count: processes.length },
    { key: 'team', label: 'Team Members', count: members.length },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Masters</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage departments, processes and team members</p>
        </div>
        {tab !== 'team' && (
          <button onClick={() => openModal(tab)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
            + Add {tab === 'departments' ? 'Department' : 'Process'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}>
            {t.label}
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-20">Loading…</p>
      ) : (
        <>
          {/* Departments */}
          {tab === 'departments' && (
            <div className="grid gap-3">
              {depts.map(d => (
                <div key={d.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${!d.is_active ? 'opacity-50' : 'border-gray-200'}`}>
                  <div>
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    {d.description && <p className="text-sm text-gray-400 mt-0.5">{d.description}</p>}
                    <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${d.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal('departments', d)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Edit</button>
                    <button onClick={() => toggleActive('departments', d.id, d.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${d.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {d.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteDept(d.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">Delete</button>
                  </div>
                </div>
              ))}
              {depts.length === 0 && <p className="text-center text-gray-400 py-20">No departments yet</p>}
            </div>
          )}

          {/* Processes */}
          {tab === 'processes' && (
            <div className="grid gap-3">
              {processes.map(p => (
                <div key={p.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${!p.is_active ? 'opacity-50' : 'border-gray-200'}`}>
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    {p.description && <p className="text-sm text-gray-400 mt-0.5">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {(p.department as any)?.name || '—'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal('processes', p)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Edit</button>
                    <button onClick={() => toggleActive('processes', p.id, p.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${p.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteProcess(p.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">Delete</button>
                  </div>
                </div>
              ))}
              {processes.length === 0 && <p className="text-center text-gray-400 py-20">No processes yet</p>}
            </div>
          )}

          {/* Team */}
          {tab === 'team' && (
            <div className="grid gap-3">
              {members.map(m => {
                const color = ROLE_COLORS[m.role] || '#555'
                return (
                  <div key={m.id} className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between ${!m.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: color + '18', color }}>
                        {m.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: color + '18', color }}>{m.role}</span>
                          {(m.department as any)?.name && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                              {(m.department as any).name}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {m.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal('team', m)}
                        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Edit</button>
                      <button onClick={() => toggleActive('profiles', m.id, m.is_active)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${m.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal.type && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modal.data ? 'Edit' : 'Add'} {modal.type === 'departments' ? 'Department' : modal.type === 'processes' ? 'Process' : 'Member'}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.name || ''} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} />
              </div>

              {modal.type !== 'team' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 h-20 resize-none"
                    value={form.description || ''} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
                </div>
              )}

              {modal.type === 'processes' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                  <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.department_id || ''} onChange={e => setForm((p: any) => ({ ...p, department_id: e.target.value }))}>
                    {depts.filter(d => d.is_active).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {modal.type === 'team' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                    <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={form.role || ''} onChange={e => setForm((p: any) => ({ ...p, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                    <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={form.department_id || ''} onChange={e => setForm((p: any) => ({ ...p, department_id: e.target.value }))}>
                      <option value="">— None —</option>
                      {depts.filter(d => d.is_active).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}