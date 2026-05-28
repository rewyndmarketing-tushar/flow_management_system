import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { ChecklistTemplate, ChecklistEntry } from '../../lib/types'

export function useChecklist(userId: string, role: string, frequency = 'daily') {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [entries, setEntries] = useState<ChecklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const { data: tmpl } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('role', role)
      .eq('frequency', frequency)
      .order('order')
    if (!tmpl?.length) { setLoading(false); return }
    setTemplates(tmpl)
    const { data: ent } = await supabase
      .from('checklist_entries')
      .select('*')
      .in('template_id', tmpl.map(t => t.id))
      .eq('user_id', userId)
      .eq('date', today)
    setEntries(ent || [])
    setLoading(false)
  }, [userId, role, frequency, today])

  useEffect(() => { load() }, [load])

  async function toggle(templateId: string) {
    const existing = entries.find(e => e.template_id === templateId)
    if (existing) {
      const { data } = await supabase
        .from('checklist_entries')
        .update({ done: !existing.done, updated_at: new Date().toISOString() })
        .eq('id', existing.id).select().single()
      if (data) setEntries(p => p.map(e => e.id === data.id ? data : e))
    } else {
      const { data } = await supabase
        .from('checklist_entries')
        .insert({ template_id: templateId, user_id: userId, date: today, done: true })
        .select().single()
      if (data) setEntries(p => [...p, data])
    }
  }

  const isDone = (tid: string) =>
    entries.find(e => e.template_id === tid)?.done ?? false

  const progress = templates.length
    ? Math.round(templates.filter(t => isDone(t.id)).length / templates.length * 100)
    : 0

  return { templates, isDone, toggle, progress, loading, reload: load }
}