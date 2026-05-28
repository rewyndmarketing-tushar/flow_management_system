import { createContext, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import { ROLE_CONFIG, TAB_LABELS, TAB_ROUTES } from '../lib/constants'
import type { Profile } from '../lib/types'

export const ProfileContext = createContext<Profile | null>(null)

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside Layout')
  return ctx
}

export default function Layout({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const { signOut } = useAuth()
  const location = useLocation()
  const config = ROLE_CONFIG[profile.role]

  return (
    <ProfileContext.Provider value={profile}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">FMS</span>
<span className="text-gray-300 text-sm">|</span>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{profile.name}</span>
              <button
                onClick={signOut}
                className="text-xs text-gray-400 hover:text-gray-700 transition"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {config.tabs.map(tab => {
              const path = TAB_ROUTES[tab]
              const active = location.pathname === path
              return (
                <Link
                  key={tab}
                  to={path}
                  className={`px-4 py-2 text-sm transition border-b-2 -mb-px ${
                    active
                      ? 'border-gray-900 text-gray-900 font-medium'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </Link>
              )
            })}
          </div>

          <div>{children}</div>
        </div>
      </div>
    </ProfileContext.Provider>
  )
}