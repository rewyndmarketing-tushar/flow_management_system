import { useState } from 'react'
import { useFMS } from './useFMS'
import type { FMSProcess } from '../../lib/types'

export default function FMSPage() {
  const { processes, entries, loading, addEntry, updateStep } = useFMS()
  const [selectedProcess, setSelectedProcess] = useState<FMSProcess | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    ref_no: '', date: new Date().toISOString().split('T')[0], client: '', contact: ''
  })

  const filtered = selectedProcess
    ? entries.filter(e => e.process_id === selectedProcess.id)
    : entries

  async function handleAdd() {
    if (!selectedProcess || !form.ref_no) return
    await addEntry({
      process_id: selectedProcess.id, ...form,
      step_1_pln:null,step_1_act:null,step_2_pln:null,step_2_act:null,
      step_3_pln:null,step_3_act:null,step_4_pln:null,step_4_act:null,
      step_5_pln:null,step_5_act:null,step_6_pln:null,step_6_act:null,
      step_7_pln:null,step_7_act:null,
    })
    setForm({ ref_no:'', date: new Date().toISOString().split('T')[0], client:'', contact:'' })
    setShowForm(false)
  }

  if (loading) return <p className="text-sm text-gray-400 p-4">Loading FMS tracker…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">FMS Tracker</h2>
        <div className="flex gap-2">
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            value={selectedProcess?.id || ''}
            onChange={e => setSelectedProcess(processes.find(p => p.id === e.target.value) || null)}
          >
            <option value="">All processes</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
          {selectedProcess && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
            >
              + Add entry
            </button>
          )}
        </div>
      </div>

      {showForm && selectedProcess && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ref no.</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={form.ref_no} onChange={e => setForm(p => ({...p, ref_no: e.target.value}))}
              placeholder="e.g. INV-001"/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Client</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={form.client} onChange={e => setForm(p => ({...p, client: e.target.value}))}
              placeholder="Client name"/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contact person</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={form.contact} onChange={e => setForm(p => ({...p, contact: e.target.value}))}
              placeholder="Contact"/>
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
            <button onClick={handleAdd}
              className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Save</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No entries yet. Select a process and add an entry.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{minWidth:'900px'}}>
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Ref</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Client</th>
                {[1,2,3,4,5,6,7].map(n => (
                  <th key={n} className="text-center py-2 px-1 text-gray-500 font-medium" colSpan={2}>
                    Step {n}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <th colSpan={3}/>
                {[1,2,3,4,5,6,7].map(n => (
                  <>
                    <th key={`p${n}`} className="text-center py-1 px-1 text-gray-400 font-normal w-20">Pln</th>
                    <th key={`a${n}`} className="text-center py-1 px-1 text-gray-400 font-normal w-20">Act</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium text-gray-700">{entry.ref_no}</td>
                  <td className="py-2 px-2 text-gray-500">{entry.date}</td>
                  <td className="py-2 px-2 text-gray-600">{entry.client}</td>
                  {[1,2,3,4,5,6,7].map(n => {
                    const pln = (entry as any)[`step_${n}_pln`]
                    const act = (entry as any)[`step_${n}_act`]
                    const breached = pln && act && act > pln
                    return (
                      <>
                        <td key={`p${n}`} className="py-1 px-1">
                          <input type="date" defaultValue={pln||''}
                            onBlur={e => updateStep(entry.id, `step_${n}_pln`, e.target.value)}
                            className="w-full border-0 bg-transparent text-gray-500 focus:outline-none focus:bg-blue-50 rounded px-1 py-0.5 text-xs"/>
                        </td>
                        <td key={`a${n}`} className="py-1 px-1">
                          <input type="date" defaultValue={act||''}
                            onBlur={e => updateStep(entry.id, `step_${n}_act`, e.target.value)}
                            className={`w-full border-0 bg-transparent focus:outline-none focus:bg-green-50 rounded px-1 py-0.5 text-xs ${
                              breached ? 'text-red-500 font-medium' : act ? 'text-green-600' : 'text-gray-400'
                            }`}/>
                        </td>
                      </>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}