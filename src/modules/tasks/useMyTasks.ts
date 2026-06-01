import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface MyTask {
  id: string
  type: 'job_step' | 'checklist'
  title: string
  description: string
  due: string | null
  status: 'pending' | 'overdue' | 'done' | 'in_progress'
  jobId?: string
  jobNumber?: string
  jobTitle?: string
  stepNumber?: number
  totalSteps?: number
  checklistTemplateId?: string
  priority: 'high' | 'medium' | 'low'
}

export function useMyTasks(userId: string, role: string) {
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (userId && role) load()
  }, [userId, role])

  async function load() {
    setLoading(true)
    const allTasks: MyTask[] = []

    // Job steps assigned to this role
    const { data: jobSteps } = await supabase
      .from('job_steps')
      .select('*, jobs(id, job_number, title, status, fms_processes(name))')
      .eq('assigned_role', role)
      .neq('status', 'completed')
      .order('planned_date')

    if (jobSteps) {
      for (const step of jobSteps) {
        const job = (step as any).jobs
        if (!job || job.status === 'completed') continue

        const isOverdue = step.planned_date && step.planned_date < today
        const isDueToday = step.planned_date === today

        allTasks.push({
          id: step.id,
          type: 'job_step',
          title: step.what,
          description: `${job.job_number} — ${job.title}`,
          due: step.planned_date,
          status: isOverdue ? 'overdue' : step.status as any,
          jobId: job.id,
          jobNumber: job.job_number,
          jobTitle: job.title,
          stepNumber: step.step_number,
          totalSteps: null as any,
          priority: isOverdue ? 'high' : isDueToday ? 'medium' : 'low'
        })
      }
    }

    // Daily checklist items
    const { data: tmpl } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('role', role)
      .eq('frequency', 'daily')
      .order('order')

    if (tmpl?.length) {
      const { data: entries } = await supabase
        .from('checklist_entries')
        .select('*')
        .in('template_id', tmpl.map(t => t.id))
        .eq('user_id', userId)
        .eq('date', today)

      for (const t of tmpl) {
        const entry = entries?.find(e => e.template_id === t.id)
        const isDone = entry?.done || false
        allTasks.push({
          id: `cl-${t.id}`,
          type: 'checklist',
          title: t.task,
          description: `Daily CL — by ${t.tat}`,
          due: t.tat,
          status: isDone ? 'done' : 'pending',
          checklistTemplateId: t.id,
          priority: 'low'
        })
      }
    }

    // Sort: overdue first, then by priority
    allTasks.sort((a, b) => {
      const order = { overdue: 0, in_progress: 1, pending: 2, done: 3 }
      return (order[a.status] || 2) - (order[b.status] || 2)
    })

    setTasks(allTasks)
    setLoading(false)
  }

  async function completeJobStep(stepId: string, jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('job_steps').update({
      actual_date: today,
      status: 'completed',
      completed_by: user?.id
    }).eq('id', stepId)

    const { data: steps } = await supabase
      .from('job_steps').select('status').eq('job_id', jobId)
    const allDone = steps?.every(s => s.status === 'completed')
    if (allDone) {
      await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId)
    }
    await load()
  }

  async function toggleChecklist(templateId: string) {
    const task = tasks.find(t => t.checklistTemplateId === templateId)
    const isDone = task?.status === 'done'
    const existing = await supabase
      .from('checklist_entries').select('*')
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existing.data) {
      await supabase.from('checklist_entries')
        .update({ done: !isDone }).eq('id', existing.data.id)
    } else {
      await supabase.from('checklist_entries')
        .insert({ template_id: templateId, user_id: userId, date: today, done: true })
    }
    await load()
  }

  const pendingCount = tasks.filter(t => t.status !== 'done').length
  const overdueCount = tasks.filter(t => t.status === 'overdue').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  return {
    tasks, loading,
    pendingCount, overdueCount, doneCount,
    completeJobStep, toggleChecklist,
    reload: load
  }
}