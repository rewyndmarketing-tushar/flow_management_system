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

export function useDeptChecklist(userId: string, role: string) {
  const [tasks, setTasks] = useState<any[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [allDepts, setAllDepts] = useState<{ id: string; name: string }[]>([])
  const [selectedDept, setSelectedDept] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  

  useEffect(() => { loadDepts() }, [])
  useEffect(() => { if (selectedDept) loadTasks(selectedDept.id) }, [selectedDept])

  async function loadDepts() {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    setAllDepts(data || [])
    if (data && data.length > 0) setSelectedDept(data[0])
    setLoading(false)
  }

  const loadTasks = useCallback(async (deptId: string) => {
    setLoading(true)
    const [{ data: taskData }, { data: completions }] = await Promise.all([
      supabase.from('tasks')
        .select('*')
        .eq('department_id', deptId)
        .eq('is_active', true)
        .order('created_at'),
      supabase.from('task_completions')
        .select('task_id, completed_by')
        .eq('date', today)
    ])
    setTasks(taskData || [])
    setCompletedIds(new Set((completions || []).map(c => c.task_id)))
    setLoading(false)
  }, [today])

  async function toggle(taskId: string, _userName: string) {
    const isDone = completedIds.has(taskId)
    if (isDone) {
      await supabase.from('task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('completed_by', userId)
        .eq('date', today)
      setCompletedIds(prev => { const s = new Set(prev); s.delete(taskId); return s })
    } else {
      await supabase.from('task_completions')
        .insert({ task_id: taskId, completed_by: userId, date: today })
      await supabase.from('tasks')
        .update({ last_done: new Date().toISOString() })
        .eq('id', taskId)
      setCompletedIds(prev => new Set([...prev, taskId]))
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, last_done: today } : t))
    }
  }

  async function editTemplate(id: string, updates: { title: string; type: string; tat: string; priority: string; assigned_to?: string }) {
    await supabase.from('tasks').update({
      title: updates.title,
      type: updates.type,
      tat: updates.tat || null,
      priority: updates.priority,
      assigned_to: updates.assigned_to || null,
      contact_person: (updates as any).contact_person || null,
      mob: (updates as any).mob || null,
      person_accountable: (updates as any).person_accountable || null,
    }).eq('id', id)
    if (selectedDept) await loadTasks(selectedDept.id)
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    if (selectedDept) loadTasks(selectedDept.id)
  }

  async function addTemplate(task: string, tat: string) {
    if (!selectedDept) return
    const { data } = await supabase.from('tasks').insert({
      title: task,
      description: tat,
      type: 'daily',
      priority: 'medium',
      department_id: selectedDept.id,
      is_active: true,
    }).select().single()
    if (data) setTasks(p => [...p, data])
  }

  function getMyEntry(taskId: string) {
    return completedIds.has(taskId) ? { done: true } : null
  }

  function getAllEntries(taskId: string) {
    return completedIds.has(taskId) ? [{ user_name: 'Done' }] : []
  }

  const templates = tasks.map(t => ({
    id: t.id,
    department: selectedDept?.name || '',
    task: t.title,
    tat: t.tat || '',
    frequency: t.type,
    order: 0,
    last_done: t.last_done || null,
    contact_person: t.contact_person || '',
    mob: t.mob || '',
    person_accountable: t.person_accountable || '',
    sub_category: t.sub_category || '',
  }))

  const myDoneCount = tasks.filter(t => completedIds.has(t.id)).length
  const progress = tasks.length ? Math.round(myDoneCount / tasks.length * 100) : 0
  const myDept = selectedDept?.name || ''

  return {
    templates, entries: [], allDepts: allDepts.map(d => d.name),
    selectedDept: selectedDept?.name || '',
    setSelectedDept: (name: string) => {
      const dept = allDepts.find(d => d.name === name)
      if (dept) setSelectedDept(dept)
    },
    toggle, addTemplate, editTemplate, deleteTemplate,
    getMyEntry,
    myDoneCount, progress, myDept,
    loading,
  }
}