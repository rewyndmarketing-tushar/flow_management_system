import { useState } from 'react'
import { useMIS } from './useMIS'
import { ROLE_CONFIG } from '../../lib/constants'
import type { FMSStep } from '../../lib/types'

type AdminTab = 'dashboard' | 'processes' | 'checklists'

export default function MISDashboard() {
  const { stats, processes, templates, loading,
    addProcess, deleteProcess, addTemplate, deleteTemplate } = useMIS()
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')
  const [showProcessForm, setShowProcessForm] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null)

  const [pForm, setPForm] = useState({
    code: '', name: '', department: '', steps: '[]'
  })
  const [tForm, setTForm] = useState<{
    role: string, task: string, tat: string, frequency: 'daily'|'weekly'|'monthly', order: number
  }>({
    role: 'crm', task: '', tat: '', frequency: 'daily', order: 0
})

  const totalTasks = stats.reduce((a, s) => a + s.total, 0)
  const totalDone = stats.reduce((a, s) => a + s.done, 0)
  const overallPct = totalTasks ? Math.round(totalDone / totalTasks * 100) : 0

  async function handleAddProcess() {
    if (!pForm.code || !pForm.name) return
    let steps = []
    try { steps = JSON.parse(pForm.steps) } catch { steps = [] }
    await addProcess({ ...pForm, steps })
    setPForm({ code: '', name: '', department: '', steps: '[]' })
    setShowProcessForm(false)
  }

  async function handleAddTemplate() {
    if (!tForm.task || !tForm.tat) return
    await addTemplate(tForm as any)
    setTForm({ role: 'crm', task: '', tat: '', frequency: 'daily', order: 0 })
    setShowTemplateForm(false)
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading MIS…</p>

  const roles = Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {(['dashboard','processes','checklists'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setAdminTab(t)}
            className={`px-4 py-2 text-sm transition border-b-2 -mb-px capitalize ${
              adminTab === t
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}>
            {t === 'dashboard' ? 'MIS Dashboard' : t === 'processes' ? 'FMS Processes' : 'Checklists'}
          </button>
        ))}
      </div>

      {adminTab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Team members', value: stats.length },
              { label: 'Tasks today', value: totalTasks },
              { label: 'Overall completion', value: `${overallPct}%` },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
              {['Name','Role','Progress','Done','Total','Status'].map(h => (
                <span key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>
            {stats.map(({ profile, total, done, pct }) => {
              const config = ROLE_CONFIG[profile.role]
              return (
                <div key={profile.id} className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-gray-50 items-center">
                  <span className="text-sm font-medium text-gray-800">{profile.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: config.bg, color: config.color }}>
                    {config.label}
                  </span>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct===100?'#16a34a':pct>50?'#2563eb':'#d97706' }}/>
                  </div>
                  <span className="text-sm text-gray-700">{done}</span>
                  <span className="text-sm text-gray-400">{total}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                    pct===100?'bg-green-50 text-green-700':pct>0?'bg-amber-50 text-amber-700':'bg-red-50 text-red-600'
                  }`}>
                    {pct===100?'Complete':pct>0?'In progress':'Not started'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {adminTab === 'processes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700">FMS Processes ({processes.length})</h3>
            <button onClick={() => setShowProcessForm(true)}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
              + Add process
            </button>
          </div>

          {showProcessForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Code</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={pForm.code} onChange={e => setPForm(p=>({...p,code:e.target.value}))}
                    placeholder="e.g. FMS-S-05"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={pForm.name} onChange={e => setPForm(p=>({...p,name:e.target.value}))}
                    placeholder="Process name"/>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Department</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  value={pForm.department} onChange={e => setPForm(p=>({...p,department:e.target.value}))}
                  placeholder="e.g. Sales"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Steps (JSON)</label>
                <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                  value={pForm.steps} onChange={e => setPForm(p=>({...p,steps:e.target.value}))}
                  placeholder='[{"number":1,"what":"Task","who":"Person","when_tat":"1 day","how":"Method"}]'/>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowProcessForm(false)}
                  className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
                <button onClick={handleAddProcess}
                  className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Save</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {processes.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedProcess(expandedProcess === p.id ? null : p.id)}>
                  <div>
                    <span className="text-xs font-medium text-gray-400 mr-2">{p.code}</span>
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    <span className="text-xs text-gray-400 ml-2">· {p.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{p.steps.length} steps</span>
                    <button onClick={e => { e.stopPropagation(); deleteProcess(p.id) }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded">Delete</button>
                    <span className="text-gray-300 text-xs">{expandedProcess === p.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedProcess === p.id && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['What','Who','When (TAT)','How'].map(h => (
                        <span key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</span>
                      ))}
                    </div>
                    {(p.steps as FMSStep[]).map(step => (
                      <div key={step.number} className="grid grid-cols-4 gap-2 py-2 border-t border-gray-50">
                        <div>
                          <span className="text-xs text-gray-400 mr-1">{step.number}.</span>
                          <span className="text-sm text-gray-800">{step.what}</span>
                        </div>
                        <span className="text-sm text-gray-600">{step.who}</span>
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full w-fit h-fit">{step.when_tat}</span>
                        <span className="text-xs text-gray-500">{step.how}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'checklists' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Checklist templates ({templates.length})</h3>
            <button onClick={() => setShowTemplateForm(true)}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
              + Add task
            </button>
          </div>

          {showTemplateForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Role</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={tForm.role} onChange={e => setTForm(p=>({...p,role:e.target.value}))}>
                    {roles.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={tForm.frequency} onChange={e => setTForm(p=>({...p,frequency:e.target.value as any}))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Task</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  value={tForm.task} onChange={e => setTForm(p=>({...p,task:e.target.value}))}
                  placeholder="Task description"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TAT / Due</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={tForm.tat} onChange={e => setTForm(p=>({...p,tat:e.target.value}))}
                    placeholder="e.g. 9:30 AM or Monday"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Order</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={tForm.order} onChange={e => setTForm(p=>({...p,order:parseInt(e.target.value)}))}/>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowTemplateForm(false)}
                  className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
                <button onClick={handleAddTemplate}
                  className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Save</button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ROLE_CONFIG[t.role]?.bg, color: ROLE_CONFIG[t.role]?.color }}>
                      {ROLE_CONFIG[t.role]?.label}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{t.frequency}</span>
                  </div>
                  <p className="text-sm text-gray-800">{t.task}</p>
                  <p className="text-xs text-gray-400">by {t.tat}</p>
                </div>
                <button onClick={() => deleteTemplate(t.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded ml-4">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}