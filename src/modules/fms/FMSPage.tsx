import { useState } from 'react'
import { useFMS } from './useFMS'
import { useNavigate } from 'react-router-dom'
import type { FMSProcess } from '../../lib/types'
import { Plus, ExternalLink } from 'lucide-react'

export default function FMSPage() {
  const { processes, entries, loading, addEntry, updateStep } = useFMS()
  const navigate = useNavigate()
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading FMS tracker…</p>
    </div>
  )

  const steps = selectedProcess ? selectedProcess.steps : []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>FMS Tracker</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>Flow Management System — planned vs actual</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            style={{
              border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px',
              fontSize: 13, color: '#374151', backgroundColor: '#fff', cursor: 'pointer',
              outline: 'none', minWidth: 200,
            }}
            value={selectedProcess?.id || ''}
            onChange={e => setSelectedProcess(processes.find(p => p.id === e.target.value) || null)}>
            <option value="">All processes</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
          {selectedProcess && (
            <button onClick={() => setShowForm(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: '#111', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Process info bar */}
      {selectedProcess && (
        <div style={{
          backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, margin: 0 }}>PROCESS</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '2px 0 0' }}>{selectedProcess.name}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, margin: 0 }}>CODE</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#8B1A1A', margin: '2px 0 0' }}>{selectedProcess.code}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, margin: 0 }}>DEPARTMENT</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '2px 0 0' }}>{selectedProcess.department}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, margin: 0 }}>STEPS</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '2px 0 0' }}>{selectedProcess.steps.length}</p>
          </div>
          <button onClick={() => navigate(`/fms/builder/${selectedProcess.id}`)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid #E5E7EB', backgroundColor: '#fff', borderRadius: 8,
              padding: '6px 12px', fontSize: 12, color: '#374151', cursor: 'pointer',
            }}>
            <ExternalLink size={12} /> View Process
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && selectedProcess && (
        <div style={{
          backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          padding: 20, marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>New Entry</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Ref No.', key: 'ref_no', placeholder: 'e.g. INV-001', type: 'text' },
              { label: 'Date', key: 'date', placeholder: '', type: 'date' },
              { label: 'Client', key: 'client', placeholder: 'Client name', type: 'text' },
              { label: 'Contact', key: 'contact', placeholder: 'Contact person', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
                    padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={{
              border: '1px solid #E5E7EB', backgroundColor: '#fff', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#374151',
            }}>Cancel</button>
            <button onClick={handleAdd} style={{
              backgroundColor: '#111', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Save Entry</button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          padding: '60px 20px', textAlign: 'center',
        }}>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No entries yet. Select a process and add an entry.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000, fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6B7280', fontWeight: 700, fontSize: 11, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>REF</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6B7280', fontWeight: 700, fontSize: 11, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>DATE</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6B7280', fontWeight: 700, fontSize: 11, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>CLIENT</th>
                  {[1,2,3,4,5,6,7].map(n => (
                    <th key={n} colSpan={2} style={{
                      textAlign: 'center', padding: '10px 8px', color: '#374151',
                      fontWeight: 700, fontSize: 11, borderLeft: '1px solid #F3F4F6',
                      backgroundColor: n % 2 === 0 ? '#F9FAFB' : '#fff',
                    }}>
                      {steps[n-1] ? steps[n-1].what : `Step ${n}`}
                    </th>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th colSpan={3} />
                  {[1,2,3,4,5,6,7].map(n => (
                    <>
                      <th key={`p${n}`} style={{ textAlign: 'center', padding: '6px 4px', color: '#9CA3AF', fontWeight: 500, fontSize: 10, borderLeft: '1px solid #F3F4F6' }}>Planned</th>
                      <th key={`a${n}`} style={{ textAlign: 'center', padding: '6px 4px', color: '#9CA3AF', fontWeight: 500, fontSize: 10 }}>Actual</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <tr key={entry.id} style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                    backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                  }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#8B1A1A', whiteSpace: 'nowrap' }}>{entry.ref_no}</td>
                    <td style={{ padding: '10px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{entry.date}</td>
                    <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{entry.client}</td>
                    {[1,2,3,4,5,6,7].map(n => {
                      const pln = (entry as any)[`step_${n}_pln`]
                      const act = (entry as any)[`step_${n}_act`]
                      const today = new Date().toISOString().split('T')[0]
                      const delayed = pln && !act && pln < today
                      const breached = pln && act && act > pln
                      return (
                        <>
                          <td key={`p${n}`} style={{ padding: '6px 4px', borderLeft: '1px solid #F3F4F6' }}>
                            <input type="date" defaultValue={pln || ''}
                              onBlur={e => updateStep(entry.id, `step_${n}_pln`, e.target.value)}
                              style={{
                                width: '100%', border: 'none', backgroundColor: 'transparent',
                                fontSize: 11, color: delayed ? '#DC2626' : '#6B7280',
                                outline: 'none', cursor: 'pointer', padding: '2px 4px',
                              }} />
                          </td>
                          <td key={`a${n}`} style={{ padding: '6px 4px' }}>
                            <input type="date" defaultValue={act || ''}
                              onBlur={e => updateStep(entry.id, `step_${n}_act`, e.target.value)}
                              style={{
                                width: '100%', border: 'none', backgroundColor: 'transparent',
                                fontSize: 11, outline: 'none', cursor: 'pointer', padding: '2px 4px',
                                color: breached ? '#DC2626' : act ? '#16A34A' : '#D1D5DB',
                                fontWeight: act ? 600 : 400,
                              }} />
                          </td>
                        </>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
            </span>
            <span style={{ fontSize: 11, color: '#16A34A' }}>● On time</span>
            <span style={{ fontSize: 11, color: '#DC2626' }}>● Delayed</span>
          </div>
        </div>
      )}
    </div>
  )
}