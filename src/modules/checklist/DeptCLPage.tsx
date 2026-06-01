import { useState } from 'react'
import { useDeptChecklist } from './useDeptChecklist'
import { useProfile } from '../../components/Layout'

export default function DeptCLPage() {
  const profile = useProfile()
  const {
    templates, allDepts, selectedDept, loading,
    setSelectedDept, toggle, addTemplate,
    getMyEntry, getAllEntries, myDoneCount, progress, myDept
  } = useDeptChecklist(profile.user_id, profile.role)

  const isManager = ['owner', 'ea', 'mis'].includes(profile.role)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newTat, setNewTat] = useState('')

  async function handleAdd() {
    if (!newTask.trim()) return
    await addTemplate(newTask.trim(), newTat.trim() || 'End of day')
    setNewTask(''); setNewTat(''); setShowAdd(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Department CL</h2>
          <p className="text-xs text-gray-400 mt-0.5">Shared checklist for your team</p>
        </div>
        {isManager && (
          <button onClick={() => setShowAdd(true)}
            className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700">
            + Add Task
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(allDepts.length === 0 ? [myDept] : allDepts).map(dept => (
          <button key={dept} onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedDept === dept ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {dept}
          </button>
        ))}
      </div>

      {templates.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Your progress: {myDoneCount}/{templates.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-800 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Task — {selectedDept}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">TASK *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Task description" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">BY WHEN</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                value={newTat} onChange={e => setNewTat(e.target.value)} placeholder="e.g. 6:00 PM" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
            <button onClick={handleAdd} className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Add Task</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 p-4">Loading…</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No department tasks yet.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {templates.map(t => {
            const myEntry = getMyEntry(t.id)
            const completedBy = getAllEntries(t.id)
            const isDone = myEntry?.done || false
            return (
              <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                <button onClick={() => toggle(t.id, profile.name)}
                  className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                    isDone ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
                  }`}>
                  {isDone && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.task}</p>
                  <p className="text-xs text-gray-400">by {t.tat}</p>
                  {completedBy.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ✓ {completedBy.map(e => e.user_name).filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDone ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {isDone ? 'Done' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}