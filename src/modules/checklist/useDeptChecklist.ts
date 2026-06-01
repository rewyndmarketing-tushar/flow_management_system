import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export interface DeptTemplate {
  id: string
  department: string
  task: string
  tat: string
  frequency: string
  order: number
}

export interface DeptEntry {
  id: string
  template_id: string
  user_id: string
  user_name: string
  date: string
  done: boolean
}

const DEPT_MAP: Record<string, string[]> = {
  'Sales':       ['owner', 'crm', 'ea'],
  'Production':  ['pc-production', 'pc-rigid'],
  'Dispatch':    ['pc-dispatch'],
  'Purchase':    ['pc-purchase'],
  'Finance':     ['pc-finance'],
  'Admin & HR':  ['pc-admin'],
  'Systems':     ['mis'],
}

export function getDeptForRole(role: string): string {
  for (const [dept, roles] of Object.entries(DEPT_MAP)) {
    if (roles.includes(role)) return dept
  }
  return 'General'
}

export function useDeptChecklist(userId: string, role: string) {
  const [templates, setTemplates] = useState<DeptTemplate[]>([])
  const [entries, setEntries] = useState<DeptEntry[]>([])
  const [allDepts, setAllDepts] = useState<string[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const myDept = getDeptForRole(role)

  useEffect(() => {
    loadDepts()
  }, [])

  useEffect(() => {
    if (selectedDept) loadTemplates(selectedDept)
  }, [selectedDept])

  async function loadDepts() {
    const { data } = await supabase
      .from('dept_checklist_templates')
      .select('department')
    const depts = [...new Set(data?.map(d => d.department) || [])]
    setAllDepts(depts)
    const defaultDept = depts.includes(myDept) ? myDept : depts[0] || myDept
    setSelectedDept(defaultDept)
    setLoading(false)
  }

  const loadTemplates = useCallback(async (dept: string) => {
    setLoading(true)
    const { data: tmpl } = await supabase
      .from('dept_checklist_templates')
      .select('*')
      .eq('department', dept)
      .order('order')
    setTemplates(tmpl || [])

    if (tmpl?.length) {
      const { data: ent } = await supabase
        .from('dept_checklist_entries')
        .select('*')
        .in('template_id', tmpl.map(t => t.id))
        .eq('date', today)
      setEntries(ent || [])
    } else {
      setEntries([])
    }
    setLoading(false)
  }, [today])

  async function toggle(templateId: string, userName: string) {
    const existing = entries.find(e => e.template_id === templateId && e.user_id === userId)
    if (existing) {
      const { data } = await supabase
        .from('dept_checklist_entries')
        .update({ done: !existing.done, updated_at: new Date().toISOString() })
        .eq('id', existing.id).select().single()
      if (data) setEntries(p => p.map(e => e.id === data.id ? data : e))
    } else {
      const { data } = await supabase
        .from('dept_checklist_entries')
        .insert({ template_id: templateId, user_id: userId, user_name: userName, date: today, done: true })
        .select().single()
      if (data) setEntries(p => [...p, data])
    }
  }

  async function addTemplate(task: string, tat: string) {
    const { data } = await supabase
      .from('dept_checklist_templates')
      .insert({ department: selectedDept, task, tat, frequency: 'daily', order: templates.length })
      .select().single()
    if (data) {
      setTemplates(p => [...p, data])
    }
  }

  function getMyEntry(templateId: string) {
    return entries.find(e => e.template_id === templateId && e.user_id === userId)
  }

  function getAllEntries(templateId: string) {
    return entries.filter(e => e.template_id === templateId && e.done)
  }

  const myDoneCount = templates.filter(t => getMyEntry(t.id)?.done).length
  const progress = templates.length ? Math.round(myDoneCount / templates.length * 100) : 0

  return {
    templates, entries, allDepts, selectedDept, loading,
    setSelectedDept, toggle, addTemplate,
    getMyEntry, getAllEntries,
    myDoneCount, progress, myDept
  }
}