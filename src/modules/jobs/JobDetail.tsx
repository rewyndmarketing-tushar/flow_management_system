import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getJobSteps, useJobs } from './useJobs'
import type { JobStep } from './useJobs'
import { supabase } from '../../lib/supabase'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { completeStep } = useJobs(profile?.role)
  const [job, setJob] = useState<any>(null)
  const [steps, setSteps] = useState<JobStep[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const { data: jobData } = await supabase
      .from('jobs').select('*, fms_processes(code, name)')
      .eq('id', id).single()
    setJob(jobData)
    const stepsData = await getJobSteps(id!)
    setSteps(stepsData)
    setLoading(false)
  }

  async function handleComplete(step: JobStep) {
    if (!window.confirm(`Mark "${step.what}" as completed?`)) return
    if (notes[step.id]) {
      await supabase.from('job_steps').update({ notes: notes[step.id] }).eq('id', step.id)
    }
    await completeStep(step.id, step.job_id)
    await load()
  }

  const statusColor = (status: string) => {
    if (status === 'completed') return '#1B5E20'
    if (status === 'delayed') return '#C0392B'
    if (status === 'in_progress') return '#1565C0'
    return '#F57F17'
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const progress = steps.length ? Math.round(completedCount / steps.length * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400 text-sm">Loading job…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <button onClick={() => navigate(-1)}
        className="text-sm text-red-800 font-semibold mb-4 hover:underline">
        ← Back
      </button>

      {/* Job Header */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-xs text-red-800 font-bold mb-1">{job?.job_number}</p>
        <p className="text-lg font-bold text-white mb-1">{job?.title}</p>
        {job?.client && <p className="text-sm text-gray-400 mb-1">{job.client}</p>}
        <p className="text-xs text-gray-600">{job?.fms_processes?.code} — {job?.fms_processes?.name}</p>
      </div>

      {/* Progress */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-400">{completedCount}/{steps.length} steps completed</span>
          <span className="text-xs font-bold text-red-800">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#1B5E20' : '#8B1A1A' }} />
        </div>
      </div>

      <p className="text-xs text-gray-600 tracking-widest font-bold mb-3">STEPS</p>

      {steps.map((step, i) => {
        const isCompleted = step.status === 'completed'
        const isNext = !isCompleted && steps.slice(0, i).every(s => s.status === 'completed')
        const today = new Date().toISOString().split('T')[0]
        const isDelayed = step.planned_date && !isCompleted && step.planned_date < today

        return (
          <div key={step.id} className="rounded-xl p-4 mb-3 border"
            style={{
              backgroundColor: isCompleted ? '#1B5E2010' : isDelayed ? '#C0392B10' : '#1a1a1a',
              borderColor: isCompleted ? '#1B5E2030' : isDelayed ? '#C0392B30' : isNext ? '#8B1A1A44' : '#2a2a2a'
            }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: isCompleted ? '#1B5E20' : isDelayed ? '#C0392B' : '#8B1A1A' }}>
                {isCompleted ? '✓' : step.step_number}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-100 mb-0.5">{step.what}</p>
                <p className="text-xs text-gray-500">👤 {step.who}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{ backgroundColor: statusColor(step.status) + '22', color: statusColor(step.status) }}>
                {step.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><span className="text-xs text-gray-600">⏰ TAT — </span><span className="text-xs text-gray-400">{step.when_tat}</span></div>
              <div><span className="text-xs text-gray-600">📅 Planned — </span><span className="text-xs text-gray-400">{step.planned_date || '—'}</span></div>
              {step.how && <div className="col-span-2"><span className="text-xs text-gray-600">📋 How — </span><span className="text-xs text-gray-400">{step.how}</span></div>}
              <div><span className="text-xs text-gray-600">✅ Actual — </span><span className="text-xs" style={{ color: isDelayed ? '#C0392B' : '#9ca3af' }}>{step.actual_date || '—'}</span></div>
            </div>

            {!isCompleted && isNext && (
              <div className="border-t border-gray-800 pt-3 flex flex-col gap-2">
                <input
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                  placeholder="Add notes (optional)…"
                  value={notes[step.id] || ''}
                  onChange={e => setNotes(p => ({ ...p, [step.id]: e.target.value }))}
                />
                <button onClick={() => handleComplete(step)}
                  className="w-full bg-red-900 hover:bg-red-800 text-white text-sm font-bold py-2 rounded-lg transition">
                  Mark Complete ✓
                </button>
              </div>
            )}

            {step.notes && <p className="text-xs text-gray-600 italic mt-2">📝 {step.notes}</p>}
          </div>
        )
      })}
    </div>
  )
}