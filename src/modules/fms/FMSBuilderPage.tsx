import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Step {
  number: number
  what: string
  who: string
  when_tat: string
  how: string
}

export default function FMSBuilderPage({ processId, onBack }: { processId: string; onBack: () => void }) {
  const [process, setProcess] = useState<any>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editStep, setEditStep] = useState<Step | null>(null)

  useEffect(() => { load() }, [processId])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('fms_processes').select('*').eq('id', processId).single()
    setProcess(data); setSteps(data?.steps || [])
    setLoading(false)
  }

  function addStep() {
    const newStep = { number: steps.length + 1, what: '', who: '', when_tat: '', how: '' }
    setEditStep(newStep); setEditIdx(-1)
  }

  function saveEditStep() {
    if (!editStep?.what || !editStep?.who) return
    if (editIdx === -1) {
      setSteps(p => [...p, { ...editStep, number: p.length + 1 }])
    } else if (editIdx !== null) {
      setSteps(p => p.map((s, i) => i === editIdx ? editStep : s))
    }
    setEditStep(null); setEditIdx(null)
  }

  function deleteStep(i: number) {
    setSteps(p => p.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, number: idx + 1 })))
  }

  function moveStep(i: number, dir: 'up' | 'down') {
    const newSteps = [...steps]
    const swapIdx = dir === 'up' ? i - 1 : i + 1
    if (swapIdx < 0 || swapIdx >= newSteps.length) return
    ;[newSteps[i], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[i]]
    setSteps(newSteps.map((s, idx) => ({ ...s, number: idx + 1 })))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('fms_processes').update({ steps }).eq('id', processId)
    setSaving(false)
    onBack()
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading…</p>

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 mb-4 hover:underline">← Back</button>
      <div className="mb-4">
        <span className="text-xs font-bold text-gray-400">{process?.code}</span>
        <h2 className="text-base font-semibold text-gray-900">{process?.name}</h2>
        <p className="text-xs text-gray-400">{process?.department}</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{steps.length} Steps</span>
        <button onClick={addStep} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium">+ Add Step</button>
      </div>

      {editStep && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {editIdx === -1 ? 'Add Step' : `Edit Step ${editStep.number}`}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { key: 'what', label: 'WHAT *', placeholder: 'e.g. Create job card' },
              { key: 'who', label: 'WHO *', placeholder: 'e.g. PC Production' },
              { key: 'when_tat', label: 'WHEN (TAT)', placeholder: 'e.g. Same day' },
              { key: 'how', label: 'HOW (SOP)', placeholder: 'e.g. Fill form with specs' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  placeholder={f.placeholder}
                  value={(editStep as any)[f.key]}
                  onChange={e => setEditStep(p => p ? ({ ...p, [f.key]: e.target.value }) : p)} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setEditStep(null); setEditIdx(null) }}
              className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
            <button onClick={saveEditStep}
              className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Save Step</button>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {step.number}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{step.what}</p>
                <p className="text-xs text-gray-500">👤 {step.who} · ⏰ {step.when_tat}</p>
                {step.how && <p className="text-xs text-gray-400 mt-1">📋 {step.how}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveStep(i, 'up')} className="w-7 h-7 bg-gray-100 rounded text-xs hover:bg-gray-200">↑</button>
                <button onClick={() => moveStep(i, 'down')} className="w-7 h-7 bg-gray-100 rounded text-xs hover:bg-gray-200">↓</button>
                <button onClick={() => { setEditStep({ ...step }); setEditIdx(i) }}
                  className="w-7 h-7 bg-blue-50 rounded text-xs hover:bg-blue-100">✏️</button>
                <button onClick={() => deleteStep(i)}
                  className="w-7 h-7 bg-red-50 rounded text-xs hover:bg-red-100">🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50">
        {saving ? 'Saving…' : `Save ${steps.length} Steps`}
      </button>
    </div>
  )
}