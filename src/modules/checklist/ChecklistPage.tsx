import { useState } from 'react'
import { useProfile } from '../../components/Layout'
import { useChecklist } from './useChecklist'
import Badge from '../../components/Badge'
import ProgressBar from '../../components/ProgressBar'

type Tab = 'daily' | 'weekly'

export default function ChecklistPage() {
  const profile = useProfile()
  const [tab, setTab] = useState<Tab>('daily')

  const daily = useChecklist(profile.user_id, profile.role, 'daily')
  const weekly = useChecklist(profile.user_id, profile.role, 'weekly')

  const active = tab === 'daily' ? daily : weekly
  const done = active.templates.filter(t => active.isDone(t.id)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {tab === 'daily' ? "Today's checklist" : "This week's tasks"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
            })}
          </p>
        </div>
        <span className="text-sm font-medium text-gray-600">
          {done}/{active.templates.length} done
        </span>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-100">
        {(['daily','weekly'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium transition border-b-2 -mb-px capitalize ${
              tab === t
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'daily' ? 'Daily' : 'Weekly'}
          </button>
        ))}
      </div>

      <ProgressBar value={active.progress} className="mb-4" />

      {active.loading ? (
        <p className="text-sm text-gray-400 p-4">Loading…</p>
      ) : active.templates.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No {tab} tasks for this role yet.
        </p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {active.templates.map(t => {
            const done = active.isDone(t.id)
            return (
              <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  onClick={() => active.toggle(t.id)}
                  className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                    done
                      ? 'bg-gray-900 border-gray-900'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${
                    done ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}>
                    {t.task}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tab === 'weekly' ? `Due: ${t.tat}` : `by ${t.tat}`}
                  </p>
                </div>
                <Badge variant={done ? 'success' : 'warning'}>
                  {done ? 'Done' : 'Pending'}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}