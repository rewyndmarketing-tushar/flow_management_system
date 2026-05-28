import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ComplianceItem } from '../../lib/types'

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('compliance_items')
      .select('*').order('due_date')
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading compliance calendar…</p>

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Compliance Calendar</h2>
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {items.map(item => {
          const overdue = item.due_date < today
          const soon = !overdue && item.due_date <= new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
          return (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.task}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.owner_role} · {item.frequency}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  overdue ? 'bg-red-50 text-red-600' :
                  soon ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.due_date}
                </span>
                {overdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
                {soon && !overdue && <span className="text-xs text-amber-600 font-medium">Due soon</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}