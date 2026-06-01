import { useState } from 'react'
import { useOrg } from './useOrg'

export default function OrgPage() {
  const { orgData, loading, totalTasks, totalDone, reload } = useOrg()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const overallPct = totalTasks ? Math.round(totalDone / totalTasks * 100) : 0

  const statusColor = (pct: number) => {
    if (pct === 100) return '#16a34a'
    if (pct >= 50) return '#d97706'
    if (pct > 0) return '#ea580c'
    return '#dc2626'
  }

  const statusLabel = (pct: number) => {
    if (pct === 100) return '✓ Complete'
    if (pct >= 50) return '◑ In progress'
    if (pct > 0) return '◔ Started'
    return '○ Not started'
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading organisation…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Organisation</h2>
        <button onClick={reload} className="text-xs text-gray-400 hover:text-gray-600">↻ Refresh</button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">NAVRATAN OFFSET</span>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: 'Tasks', value: totalTasks, color: 'text-gray-900' },
            { label: 'Done', value: totalDone, color: 'text-green-600' },
            { label: 'Pending', value: totalTasks - totalDone, color: 'text-red-500' },
            { label: 'Overall', value: `${overallPct}%`, color: overallPct === 100 ? 'text-green-600' : 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${overallPct}%`, backgroundColor: statusColor(overallPct) }} />
        </div>
      </div>

      <div className="space-y-2">
        {orgData.map(func => {
          const isExp = expanded[func.name] !== false
          const color = statusColor(func.pct)
          return (
            <div key={func.name} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(p => ({ ...p, [func.name]: !isExp }))}>
                <div className="w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: color }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{func.name}</p>
                  <p className="text-xs mt-0.5" style={{ color }}>{statusLabel(func.pct)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${func.pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ color }}>{func.pct}%</span>
                  <span className="text-xs text-gray-400">{isExp ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExp && (
                <div className="border-t border-gray-50 p-4 space-y-3">
                  {func.departments.map(dept => (
                    <div key={dept.name} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">{dept.name}</span>
                        <span className="text-xs font-semibold" style={{ color: statusColor(dept.pct) }}>
                          {dept.doneTasks}/{dept.totalTasks}
                        </span>
                      </div>
                      {dept.members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 py-2 border-t border-gray-100">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{member.name}</p>
                            <p className="text-xs text-gray-400">{member.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              {member.activeJobs > 0 && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                  {member.activeJobs} jobs
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                member.pending > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                              }`}>
                                {member.pending > 0 ? `${member.pending} pending` : '✓ done'}
                              </span>
                            </div>
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1 ml-auto">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${member.pct}%`, backgroundColor: statusColor(member.pct) }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}