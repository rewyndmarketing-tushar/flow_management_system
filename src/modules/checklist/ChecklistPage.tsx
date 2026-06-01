import { useState } from 'react'
import { useProfile } from '../../components/Layout'
import { useChecklist } from './useChecklist'

type Tab = 'daily' | 'weekly'

export default function ChecklistPage() {
  const profile = useProfile()
  const [tab, setTab] = useState<Tab>('daily')

  const daily = useChecklist(profile.user_id, profile.role, 'daily')
  const weekly = useChecklist(profile.user_id, profile.role, 'weekly')

  const active = tab === 'daily' ? daily : weekly
  const doneCount = active.templates.filter(t => active.isDone(t.id)).length
  const total = active.templates.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const pctColor = pct === 100 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>
            {tab === 'daily' ? "Today's Checklist" : "Weekly Tasks"}
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: pctColor, margin: 0, lineHeight: 1 }}>{pct}%</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{doneCount}/{total} done</p>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: `conic-gradient(${pctColor} ${pct * 3.6}deg, #F3F4F6 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F9FA' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
        {(['daily', 'weekly'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid #111' : '2px solid transparent',
            color: tab === t ? '#111' : '#9CA3AF',
            marginBottom: -1, transition: 'all 0.15s',
            textTransform: 'capitalize',
          }}>
            {t === 'daily' ? 'Daily' : 'Weekly'}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, backgroundColor: pctColor, transition: 'width 0.3s' }} />
      </div>

      {/* Checklist table */}
      {active.loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</p>
        </div>
      ) : active.templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No {tab} tasks for this role yet.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px',
            backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
            padding: '10px 16px', gap: 12,
          }}>
            {['', 'Task', 'Due By', 'Status'].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{h}</p>
            ))}
          </div>

          {active.templates.map((t, i) => {
            const done = active.isDone(t.id)
            return (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px',
                padding: '12px 16px', gap: 12, alignItems: 'center',
                borderBottom: i < active.templates.length - 1 ? '1px solid #F3F4F6' : 'none',
                backgroundColor: done ? '#F9FAFB' : '#fff',
                transition: 'background 0.15s',
              }}>
                {/* Checkbox */}
                <button onClick={() => active.toggle(t.id)} style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: done ? 'none' : '1.5px solid #D1D5DB',
                  backgroundColor: done ? '#111' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {done && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* Task */}
                <div>
                  <p style={{
                    fontSize: 13, fontWeight: done ? 400 : 600, margin: 0,
                    color: done ? '#9CA3AF' : '#111',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{t.task}</p>
                </div>

                {/* Due */}
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                  {tab === 'weekly' ? t.tat : `by ${t.tat}`}
                </p>

                {/* Status badge */}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 4,
                  backgroundColor: done ? '#DCFCE7' : '#FEF9C3',
                  color: done ? '#16A34A' : '#CA8A04',
                  width: 'fit-content',
                }}>
                  {done ? 'Done' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
        {doneCount} of {total} tasks completed
      </p>
    </div>
  )
}