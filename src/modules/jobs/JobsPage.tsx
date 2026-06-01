import { useState } from 'react'
import { useJobs } from './useJobs'
import { supabase } from '../../lib/supabase'
import type { FMSProcess } from '../../lib/types'
import { useProfile } from '../../components/Layout'

type ViewTab = 'active' | 'completed' | 'all'

export default function JobsPage() {
  const profile = useProfile()
  const { jobs, activeJobs, completedJobs, loading, createJob } = useJobs(profile.role)
  const [viewTab, setViewTab] = useState<ViewTab>('active')
  const [showForm, setShowForm] = useState(false)
  const [processes, setProcesses] = useState<FMSProcess[]>([])
  const [selectedProcess, setSelectedProcess] = useState<FMSProcess | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', client: '', contact: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_completion: ''
  })
  const [creating, setCreating] = useState(false)

  const displayed = viewTab === 'active' ? activeJobs : viewTab === 'completed' ? completedJobs : jobs

  async function openForm() {
    const { data } = await supabase.from('fms_processes').select('*').order('code')
    setProcesses(data || [])
    setShowForm(true)
  }

  async function handleCreate() {
    if (!selectedProcess || !form.title) return
    setCreating(true)
    await createJob({
      fms_process_id: selectedProcess.id,
      ...form,
      expected_completion: form.expected_completion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      steps: selectedProcess.steps
    })
    setShowForm(false)
    setForm({ title: '', client: '', contact: '', order_date: new Date().toISOString().split('T')[0], expected_completion: '' })
    setSelectedProcess(null)
    setCreating(false)
  }

  const statusColor = (status: string) => {
    if (status === 'completed') return 'text-green-600 bg-green-50'
    if (status === 'delayed') return 'text-red-600 bg-red-50'
    return 'text-amber-600 bg-amber-50'
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading jobs…</p>

  if (selectedJob) return (
    <JobDetailInline jobId={selectedJob} onBack={() => setSelectedJob(null)} />
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Jobs</h2>
        <button onClick={openForm}
          className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
          + New Job
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {([
          { key: 'active', label: `Active (${activeJobs.length})` },
          { key: 'completed', label: `Done (${completedJobs.length})` },
          { key: 'all', label: `All (${jobs.length})` },
        ] as { key: ViewTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setViewTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              viewTab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Job</h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">SELECT PROCESS</label>
            <div className="flex flex-wrap gap-2">
              {processes.map(p => (
                <button key={p.id} onClick={() => setSelectedProcess(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedProcess?.id === p.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}>
                  {p.code} — {p.name}
                </button>
              ))}
            </div>
          </div>
          {selectedProcess && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-500">
              {selectedProcess.steps.length} steps: {(selectedProcess.steps as any[]).map(s => s.what).join(' → ')}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { key: 'title', label: 'Job Title *', placeholder: 'e.g. Order #1234 Sharma Exports' },
              { key: 'client', label: 'Client', placeholder: 'Client name' },
              { key: 'contact', label: 'Contact', placeholder: 'Contact person' },
              { key: 'order_date', label: 'Order Date', type: 'date' },
              { key: 'expected_completion', label: 'Expected Completion', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input type={f.type || 'text'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  placeholder={(f as any).placeholder || ''}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
              {creating ? 'Creating…' : 'Create Job'}
            </button>
          </div>
        </div>
      )}

      {displayed.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No {viewTab} jobs.</p>
      ) : (
        <div className="space-y-2">
          {displayed.map(job => (
            <div key={job.id} className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-gray-300 transition"
              onClick={() => setSelectedJob(job.id)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">{job.job_number}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(job.status)}`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                  {job.client && <p className="text-xs text-gray-400">{job.client}</p>}
                </div>
                <span className="text-xs text-gray-400">{job.expected_completion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {(job as any).fms_processes?.code} · {(job as any).fms_processes?.name}
                </span>
                <span className="text-xs text-blue-600 font-medium">View steps →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function JobDetailInline({ jobId, onBack }: { jobId: string; onBack: () => void }) {
  const [job, setJob] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useState(() => {
    load()
  })

  async function load() {
    const { data: jobData } = await supabase
      .from('jobs').select('*, fms_processes(code, name)')
      .eq('id', jobId).single()
    setJob(jobData)
    const { data: stepsData } = await supabase
      .from('job_steps').select('*').eq('job_id', jobId).order('step_number')
    setSteps(stepsData || [])
    setLoading(false)
  }

  async function completeStep(stepId: string) {
    await supabase.from('job_steps').update({
      actual_date: today, status: 'completed'
    }).eq('id', stepId)
    await load()
  }

  const completed = steps.filter(s => s.status === 'completed').length
  const progress = steps.length ? Math.round(completed / steps.length * 100) : 0

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading…</p>

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 mb-4 hover:underline">← Back to Jobs</button>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <span className="text-xs font-bold text-gray-400">{job?.job_number}</span>
        <h2 className="text-base font-semibold text-gray-900 mt-1">{job?.title}</h2>
        {job?.client && <p className="text-sm text-gray-500">{job.client}</p>}
        <p className="text-xs text-gray-400 mt-1">{job?.fms_processes?.code} — {job?.fms_processes?.name}</p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{completed}/{steps.length} steps</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-800 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map(step => {
          const isCompleted = step.status === 'completed'
          const isOverdue = step.planned_date && step.planned_date < today && !isCompleted
          return (
            <div key={step.id} className={`bg-white border rounded-xl p-4 ${
              isCompleted ? 'border-green-100 bg-green-50/30' :
              isOverdue ? 'border-red-100 bg-red-50/30' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isOverdue ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : step.step_number}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{step.what}</p>
                    <p className="text-xs text-gray-500">👤 {step.who}</p>
                  </div>
                </div>
                {!isCompleted && (
                  <button onClick={() => completeStep(step.id)}
                    className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-700">
                    Complete ✓
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2">
                <span>⏰ {step.when_tat}</span>
                <span>📅 Planned: {step.planned_date || '—'}</span>
                <span>✅ Actual: {step.actual_date || '—'}</span>
                {isOverdue && <span className="text-red-500 font-medium">⚠️ Overdue</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}