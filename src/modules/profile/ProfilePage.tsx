import { useState } from 'react'
import { useProfile } from '../../components/Layout'
import { useAuth } from '../../modules/auth/useAuth'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG } from '../../lib/constants'

export default function ProfilePage() {
  const profile = useProfile()
  const { signOut } = useAuth()
  const config = ROLE_CONFIG[profile.role]
  const [name, setName] = useState(profile.name)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')

  async function handleSaveName() {
    if (!name.trim()) return
    setSavingName(true)
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', profile.id)
    setSavingName(false)
    setNameMsg(error ? error.message : 'Name updated ✓')
    setTimeout(() => setNameMsg(''), 3000)
  }

  async function handleChangePwd() {
    if (newPassword !== confirmPassword) { setPwdMsg('Passwords do not match'); return }
    if (newPassword.length < 6) { setPwdMsg('Min 6 characters'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPwd(false)
    if (error) { setPwdMsg(error.message); return }
    setNewPassword(''); setConfirmPassword('')
    setPwdMsg('Password changed ✓')
    setTimeout(() => setPwdMsg(''), 3000)
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: config?.color + '22', color: config?.color }}>
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{profile.name}</h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: config?.bg, color: config?.color }}>
            {config?.label}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update Name</h3>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none"
          value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        <div className="flex items-center gap-3">
          <button onClick={handleSaveName} disabled={savingName}
            className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {savingName ? 'Saving…' : 'Save Name'}
          </button>
          {nameMsg && <span className="text-xs text-green-600">{nameMsg}</span>}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Change Password</h3>
        <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" />
        <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
        <div className="flex items-center gap-3">
          <button onClick={handleChangePwd} disabled={savingPwd}
            className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {savingPwd ? 'Changing…' : 'Change Password'}
          </button>
          {pwdMsg && <span className={`text-xs ${pwdMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg}</span>}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">App Info</h3>
        {[
          { label: 'App', value: 'FMS — Flow Management System' },
          { label: 'Version', value: '1.0.0' },
          { label: 'Company', value: 'Navratan Offset' },
        ].map(i => (
          <div key={i.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
            <span className="text-gray-400">{i.label}</span>
            <span className="text-gray-700 font-medium">{i.value}</span>
          </div>
        ))}
      </div>

      <button onClick={signOut}
        className="w-full border border-red-200 text-red-600 rounded-xl py-3 text-sm font-semibold hover:bg-red-50 transition">
        Sign Out
      </button>
    </div>
  )
}