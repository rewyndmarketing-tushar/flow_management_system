import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface Job {
  id: string
  fms_process_id: string
  job_number: string
  title: string
  client: string
  contact: string
  order_date: string
  expected_completion: string
  status: 'active' | 'completed' | 'delayed' | 'pending'
  created_at: string
  fms_processes?: { code: string; name: string; steps: any[] }
}

export interface JobStep {
  id: string
  job_id: string
  step_number: number
  what: string
  who: string
  when_tat: string
  how: string
  assigned_role: string
  planned_date: string | null
  actual_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  notes: string | null
}

export function useJobs(role?: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [role])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*, fms_processes(code, name, steps)')
      .order('created_at', { ascending: false })

    const { data } = await query
    setJobs(data || [])
    setLoading(false)
  }

  async function createJob(data: {
    fms_process_id: string
    title: string
    client: string
    contact: string
    order_date: string
    expected_completion: string
    steps: any[]
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    const jobNumber = `JOB-${Date.now().toString().slice(-6)}`

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        fms_process_id: data.fms_process_id,
        job_number: jobNumber,
        title: data.title,
        client: data.client,
        contact: data.contact,
        order_date: data.order_date,
        expected_completion: data.expected_completion,
        status: 'active',
        created_by: user?.id
      })
      .select()
      .single()

    if (error) throw error

    const orderDate = new Date(data.order_date)
    const jobSteps = data.steps.map((step: any, i: number) => {
      const planned = new Date(orderDate)
      planned.setDate(planned.getDate() + (i + 1))
      return {
        job_id: job.id,
        step_number: step.number,
        what: step.what,
        who: step.who,
        when_tat: step.when_tat,
        how: step.how || '',
        assigned_role: step.who,
        planned_date: planned.toISOString().split('T')[0],
        actual_date: null,
        status: 'pending'
      }
    })

    await supabase.from('job_steps').insert(jobSteps)
    await load()
    return job
  }

  async function updateJobStep(stepId: string, updates: Partial<JobStep>) {
    const { data } = await supabase
      .from('job_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single()
    return data
  }

  async function completeStep(stepId: string, jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
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

  const activeJobs = jobs.filter(j => j.status === 'active')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  return { jobs, activeJobs, completedJobs, loading, createJob, updateJobStep, completeStep, reload: load }
}

export async function getJobSteps(jobId: string): Promise<JobStep[]> {
  const { data } = await supabase
    .from('job_steps')
    .select('*')
    .eq('job_id', jobId)
    .order('step_number')
  return data || []
}