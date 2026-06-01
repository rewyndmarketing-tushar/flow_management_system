import { useState } from 'react'
import { useMyTasks } from './useMyTasks'
import { useProfile } from '../../components/Layout'

type FilterTab = 'all' | 'overdue' | 'jobs' | 'checklist' | 'done'

export default function MyTasksPage() {
  const profile = useProfile()
  const { tasks, loading, pendingCount, overdueCount, doneCount,
    completeJobStep, toggleChecklist, reload } = useMyTasks(profile.user_id, profile.role)
  const [filter, setFilter] = useState<FilterTab>('all')

  const filtered = tasks.filter(t => {
    if (filter === 'all') return t.status !== 'done'
    if (filter === 'overdue') return t.status === 'overdue'
    if (filter === 'jobs') return t.type === 'job_step' && t.status !== 'done'
    if (filter === 'checklist') return t.type === 'checklist' && t.status !== 'done'
    if (filter === 'done') return t.status === 'done'
    return true
  })

  const statusColor = (status: string) => {
    if (status === 'overdue') return 'text-red-600 bg-red-50'
    if (status === 'done') return 'text-green-600 bg-green-50'
    return 'text-amber-600 bg-amber-50'
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading tasks…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">My Tasks</h2>
        <button onClick={reload} className="text-xs text-gray-400 hover:text-gray-600">↻ Refresh</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Overdue', value: overdueCount, color: 'text-red-600' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
          { label: 'Done', value: doneCount, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { key: 'all', label: `All (${pendingCount})` },
          { key: 'overdue', label: `🔴 Overdue (${overdueCount})` },
          { key: 'jobs', label: '🏭 Jobs' },
          { key: 'checklist', label: '✅ Checklist' },
          { key: 'done', label: `✓ Done (${doneCount})` },
        ] as { key: FilterTab; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          {filter === 'done' ? 'Nothing completed yet' : 'All clear! No pending tasks.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className={`bg-white border rounded-xl p-4 ${
              task.status === 'overdue' ? 'border-red-100 bg-red-50/20' :
              task.status === 'done' ? 'border-green-100 opacity-70' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${statusColor(task.status)}`}>
                  {task.status === 'overdue' ? '⚠️ Overdue' : task.status === 'done' ? '✓ Done' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.type === 'job_step' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {task.type === 'job_step' ? '🏭 Job Step' : '✅ Daily CL'}
                  </span>
                  {task.due && <span className="text-xs text-gray-400">📅 {task.due}</span>}
                </div>
                {task.status !== 'done' && (
                  <button
                    onClick={() => task.type === 'job_step'
                      ? completeJobStep(task.id, task.jobId!)
                      : task.checklistTemplateId && toggleChecklist(task.checklistTemplateId)
                    }
                    className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-700">
                    Complete ✓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}