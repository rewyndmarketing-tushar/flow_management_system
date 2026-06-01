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

  const statusBadge = (status: string) => {
    if (status === 'overdue') return { bg: '#FEE2E2', color: '#DC2626', label: 'Overdue' }
    if (status === 'done') return { bg: '#DCFCE7', color: '#16A34A', label: 'Done' }
    return { bg: '#FEF9C3', color: '#CA8A04', label: 'Pending' }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <p style={{ color: '#888', fontSize: 13 }}>Loading tasks…</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>My Tasks</h1>
        <button onClick={reload}
          style={{ fontSize: 12, color: '#888', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Overdue', value: overdueCount, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Pending', value: pendingCount, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Done', value: doneCount, color: '#16A34A', bg: '#F0FDF4' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: s.bg, borderRadius: 10, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0, marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { key: 'all', label: `All (${pendingCount})` },
          { key: 'overdue', label: `Overdue (${overdueCount})` },
          { key: 'jobs', label: 'Jobs' },
          { key: 'checklist', label: 'Checklist' },
          { key: 'done', label: `Done (${doneCount})` },
        ] as { key: FilterTab; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              backgroundColor: filter === f.key ? '#111' : '#F3F4F6',
              color: filter === f.key ? '#fff' : '#555',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px 100px',
          backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
          padding: '10px 16px', gap: 12,
        }}>
          {['Task', 'Type', 'Due', 'Status', 'Action'].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{h}</p>
          ))}
        </div>

        {/* Table rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>
              {filter === 'done' ? 'Nothing completed yet' : 'All clear! No pending tasks.'}
            </p>
          </div>
        ) : (
          filtered.map((task, i) => {
            const badge = statusBadge(task.status)
            return (
              <div key={task.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px 100px',
                  padding: '12px 16px', gap: 12, alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                  backgroundColor: task.status === 'overdue' ? '#FFF5F5' : '#fff',
                }}>

                {/* Task title */}
                <div>
                  <p style={{
                    fontSize: 13, fontWeight: 600, margin: 0,
                    color: task.status === 'done' ? '#9CA3AF' : '#111',
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  }}>{task.title}</p>
                  {task.description && (
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, marginTop: 2 }}>{task.description}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                    backgroundColor: task.type === 'job_step' ? '#DBEAFE' : '#DCFCE7',
                    color: task.type === 'job_step' ? '#1D4ED8' : '#15803D',
                  }}>
                    {task.type === 'job_step' ? 'Job Step' : 'Daily CL'}
                  </span>
                </div>

                {/* Due */}
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{task.due || '—'}</p>

                {/* Status */}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                  backgroundColor: badge.bg, color: badge.color, width: 'fit-content',
                }}>
                  {badge.label}
                </span>

                {/* Action */}
                <div>
                  {task.status !== 'done' ? (
                    <button
                      onClick={() => task.type === 'job_step'
                        ? completeJobStep(task.id, task.jobId!)
                        : task.checklistTemplateId && toggleChecklist(task.checklistTemplateId)
                      }
                      style={{
                        backgroundColor: '#111', color: '#fff', border: 'none',
                        padding: '5px 12px', borderRadius: 6, fontSize: 11,
                        fontWeight: 600, cursor: 'pointer',
                      }}>
                      Complete ✓
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer count */}
      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
        Showing {filtered.length} task{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}