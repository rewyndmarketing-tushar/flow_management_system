import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface SearchResult {
  id: string
  type: 'job' | 'process' | 'compliance' | 'checklist'
  title: string
  subtitle: string
  meta: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (text: string) => {
    if (!text.trim()) { setResults([]); setSearched(false); return }
    setLoading(true); setSearched(true)
    const q = text.toLowerCase()
    const all: SearchResult[] = []

    const { data: jobs } = await supabase.from('jobs')
      .select('*, fms_processes(code,name)')
      .or(`title.ilike.%${q}%,client.ilike.%${q}%,job_number.ilike.%${q}%`).limit(5)
    jobs?.forEach(j => all.push({ id: j.id, type: 'job', title: j.title, subtitle: `${j.job_number} — ${j.client || ''}`, meta: `${(j as any).fms_processes?.code} · ${j.status}` }))

    const { data: processes } = await supabase.from('fms_processes')
      .select('*').or(`name.ilike.%${q}%,code.ilike.%${q}%`).limit(5)
    processes?.forEach(p => all.push({ id: p.id, type: 'process', title: p.name, subtitle: p.code, meta: p.department }))

    const { data: compliance } = await supabase.from('compliance_items')
      .select('*').ilike('task', `%${q}%`).limit(5)
    compliance?.forEach(c => all.push({ id: c.id, type: 'compliance', title: c.task, subtitle: c.owner_role, meta: `Due: ${c.due_date}` }))

    const { data: templates } = await supabase.from('checklist_templates')
      .select('*').ilike('task', `%${q}%`).limit(5)
    templates?.forEach(t => all.push({ id: t.id, type: 'checklist', title: t.task, subtitle: t.role, meta: `${t.frequency} · by ${t.tat}` }))

    setResults(all); setLoading(false)
  }, [])

  const typeConfig = {
    job:        { icon: '🏭', color: 'text-blue-600 bg-blue-50', label: 'Job' },
    process:    { icon: '📋', color: 'text-red-600 bg-red-50', label: 'Process' },
    compliance: { icon: '📅', color: 'text-amber-600 bg-amber-50', label: 'Compliance' },
    checklist:  { icon: '✅', color: 'text-green-600 bg-green-50', label: 'Checklist' },
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Search</h2>
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 mb-4 bg-white">
        <span>🔍</span>
        <input className="flex-1 text-sm focus:outline-none"
          value={query} placeholder="Search jobs, processes, tasks…"
          onChange={e => { setQuery(e.target.value); if (e.target.value.length >= 2) search(e.target.value); else { setResults([]); setSearched(false) } }} />
        {query && <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }} className="text-gray-400 hover:text-gray-600">✕</button>}
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-4">Searching…</p>}

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No results for "{query}"</p>
      )}

      {!searched && (
        <div className="space-y-2">
          {[
            { icon: '🏭', label: 'Jobs — by name, number or client' },
            { icon: '📋', label: 'FMS Processes — by name or code' },
            { icon: '📅', label: 'Compliance — by task name' },
            { icon: '✅', label: 'Checklists — by task description' },
          ].map(h => (
            <div key={h.label} className="flex items-center gap-3 text-sm text-gray-400 py-1">
              <span>{h.icon}</span><span>{h.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {results.map(r => {
          const cfg = typeConfig[r.type]
          return (
            <div key={`${r.type}-${r.id}`} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <span className="text-xl">{cfg.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.subtitle}</p>
                  <p className="text-xs text-gray-300">{r.meta}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}