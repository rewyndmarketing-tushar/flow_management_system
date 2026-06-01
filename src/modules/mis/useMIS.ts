import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile, FMSProcess, ChecklistTemplate } from '../../lib/types'

interface RoleStats {
  profile: Profile
  total: number
  done: number
  pct: number
}

export function useMIS() {
  const [stats, setStats] = useState<RoleStats[]>([])
  const [processes, setProcesses] = useState<FMSProcess[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [{ data: profiles }, { data: procs }, { data: tmpl }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('fms_processes').select('*').order('code'),
      supabase.from('checklist_templates').select('*').order('role').order('order'),
    ])
    setProcesses(procs || [])
    setTemplates(tmpl || [])
    if (!profiles?.length) { setLoading(false); return }
    const result: RoleStats[] = []
    for (const profile of profiles) {
      const { data: tmplRole } = await supabase
        .from('checklist_templates')
        .select('id').eq('role', profile.role).eq('frequency', 'daily')
      const total = tmplRole?.length || 0
      if (!total) continue
      const { data: ent } = await supabase
        .from('checklist_entries')
        .select('id')
        .in('template_id', tmplRole!.map(t => t.id))
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .eq('done', true)
      result.push({ profile, total, done: ent?.length || 0, pct: Math.round((ent?.length || 0) / total * 100) })
    }
    setStats(result)
    setLoading(false)
  }

  async function addProcess(data: Omit<FMSProcess, 'id'>) {
    const { data: created } = await supabase
      .from('fms_processes').insert(data).select().single()
    if (created) setProcesses(p => [...p, created])
    return created
  }

  async function updateProcess(id: string, data: Partial<FMSProcess>) {
    const { data: updated } = await supabase
      .from('fms_processes').update(data).eq('id', id).select().single()
    if (updated) setProcesses(p => p.map(x => x.id === id ? updated : x))
  }

  async function deleteProcess(id: string) {
    await supabase.from('fms_processes').delete().eq('id', id)
    setProcesses(p => p.filter(x => x.id !== id))
  }

  async function addTemplate(data: Omit<ChecklistTemplate, 'id'>) {
    const { data: created } = await supabase
      .from('checklist_templates').insert(data).select().single()
    if (created) setTemplates(p => [...p, created])
    return created
  }

  async function deleteTemplate(id: string) {
    await supabase.from('checklist_templates').delete().eq('id', id)
    setTemplates(p => p.filter(x => x.id !== id))
  }

  return {
    stats, processes, templates, loading,
    addProcess, updateProcess, deleteProcess,
    addTemplate, deleteTemplate,
    reload: load
  }
}