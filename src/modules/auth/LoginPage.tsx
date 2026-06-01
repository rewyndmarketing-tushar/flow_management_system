import { useState } from 'react'
import { useAuth } from './useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', backgroundColor: '#0D0D0D',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0D0D0D', padding: 48,
      }}>
        <img src="/navratan_logo.png" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 24 }} />
        <h1 style={{ color: '#F5F5F5', fontSize: 28, fontWeight: 900, letterSpacing: 2, margin: 0, textAlign: 'center' }}>NAVRATAN OFFSET</h1>
        <p style={{ color: '#555', fontSize: 13, marginTop: 8, textAlign: 'center' }}>Business Operating System</p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 320 }}>
          {[
            { icon: '✓', title: 'Daily Checklists', desc: 'Track every task, every day' },
            { icon: '⇢', title: 'FMS Tracker', desc: 'Planned vs actual — step by step' },
            { icon: '▨', title: 'MIS Dashboard', desc: 'Complete visibility for owners' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, backgroundColor: '#8B1A1A22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8B1A1A', fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>{f.icon}</div>
              <div>
                <p style={{ color: '#F5F5F5', fontSize: 13, fontWeight: 600, margin: 0 }}>{f.title}</p>
                <p style={{ color: '#555', fontSize: 11, margin: '2px 0 0' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: 420, backgroundColor: '#fff',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 48,
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Sign in</h2>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 32px' }}>Welcome back to Navratan FMS</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@navratan.com"
                required
                style={{
                  width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
                  padding: '10px 12px', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box', color: '#111',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
                  padding: '10px 12px', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box', color: '#111',
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '8px 12px', borderRadius: 6, margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', backgroundColor: '#8B1A1A', color: '#fff',
                border: 'none', borderRadius: 8, padding: '11px', fontSize: 14,
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, marginTop: 4,
              }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 32 }}>
            Navratan Offset · Flow Management System · v1.0
          </p>
        </div>
      </div>
    </div>
  )
}