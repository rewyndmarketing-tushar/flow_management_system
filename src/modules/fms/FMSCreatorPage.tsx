import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Step { number: number; what: string; who: string; when_tat: string; how: string }

export default function FMSCreatorPage({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function addStep() {
    setSteps(p => [...p, { number: p.length + 1, what: '', who: '', when_tat: '', how: '' }])
  }

  function updateStep(i: number, field: keyof Step, value: string) {
    setSteps(p => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function removeStep(i: number) {
    setSteps(p => p.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, number: idx + 1 })))
  }

  async function handleSave() {
    if (!code.trim() || !name.trim() || !steps.length) {
      setMsg('Code, name and at least one step are required')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('fms_processes').insert({
      code: code.trim().toUpperCase(), name: name.trim(),
      department: department.trim(), steps
    })
    setSaving(false)
    if (error) { setMsg(error.message); return }
    onBack()
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 mb-4 hover:underline">← Back</button>
      <h2 className="text-base font-semibold text-gray-900 mb-4">New FMS Process</h2>

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'code', label: 'CODE *', value: code, set: setCode, placeholder: 'FMS-S-05' },
            { key: 'name', label: 'NAME *', value: name, set: setName, placeholder: 'Process name' },
            { key: 'dept', label: 'DEPARTMENT', value: department, set: setDepartment, placeholder: 'e.g. Sales' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{steps.length} Steps</span>
        <button onClick={addStep} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium">+ Add Step</button>
      </div>

      <div className="space-y-2 mb-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">{step.number}</div>
              <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'what', label: 'WHAT *', placeholder: 'Task name' },
                { key: 'who', label: 'WHO *', placeholder: 'Responsible' },
                { key: 'when_tat', label: 'WHEN', placeholder: 'TAT' },
                { key: 'how', label: 'HOW', placeholder: 'Method/SOP' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                  <input className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    placeholder={f.placeholder}
                    value={(step as any)[f.key]}
                    onChange={e => updateStep(i, f.key as keyof Step, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="text-xs text-red-500 mb-3">{msg}</p>}
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50">
        {saving ? 'Creating…' : 'Create Process →'}
      </button>
    </div>
  )
}