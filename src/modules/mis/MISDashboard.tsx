import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG } from '../../lib/constants'
import type { Profile } from '../../lib/types'

interface RoleStats {
  profile: Profile
  total: number
  done: number
  pct: number
}

export default function MISDashboard() {
  const [stats, setStats] = useState<RoleStats[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles').select('*')
    if (!profiles?.length) { setLoading(false); return }

    const result: RoleStats[] = []
    for (const profile of profiles) {
      const { data: tmpl } = await supabase
        .from('checklist_templates')
        .select('id').eq('role', profile.role).eq('frequency', 'daily')
      const total = tmpl?.length || 0
      if (!total) continue
      const { data: ent } = await supabase
        .from('checklist_entries')
        .select('id').in('template_id', tmpl!.map(t => t.id))
        .eq('user_id', profile.user_id).eq('date', today).eq('done', true)
      const done = ent?.length || 0
      result.push({ profile, total, done, pct: Math.round(done / total * 100) })
    }
    setStats(result)
    setLoading(false)
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading MIS dashboard…</p>

  const totalTasks = stats.reduce((a, s) => a + s.total, 0)
  const totalDone = stats.reduce((a, s) => a + s.done, 0)
  const overallPct = totalTasks ? Math.round(totalDone / totalTasks * 100) : 0

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">MIS Dashboard</h2>

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
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? '#16a34a' : pct > 50 ? '#2563eb' : '#d97706'
                  }}/>
              </div>
              <span className="text-sm text-gray-700">{done}</span>
              <span className="text-sm text-gray-400">{total}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                pct === 100 ? 'bg-green-50 text-green-700' :
                pct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
              }`}>
                {pct === 100 ? 'Complete' : pct > 0 ? 'In progress' : 'Not started'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}