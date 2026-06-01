import { createContext, useContext, useState } from 'react'
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

const TAB_ICONS: Record<string, string> = {
  checklist:   '✓',
  mytasks:     '◎',
  deptcl:      '▦',
  jobs:        '▤',
  org:         '⊞',
  fms:         '⇢',
  compliance:  '⊡',
  mis:         '▨',
  misview:     '▲',
  deptview:    '▧',
  empview:     '◉',
  processview: '⚙',
  masters:     '◈',
  tasks:       '▣',
}

export default function Layout({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { signOut } = useAuth()
  const location = useLocation()
  const config = ROLE_CONFIG[profile.role]
  const [collapsed, setCollapsed] = useState(false)

  const isManager = ['owner', 'ea', 'mis'].includes(profile.role)

  const mainTabs = ['checklist', 'mytasks', 'deptcl', 'jobs', 'org', 'fms', 'compliance']
  const manageTabs = ['mis', 'misview', 'deptview', 'empview', 'processview']
  const adminTabs = ['masters', 'tasks']
  const userTabs = config.tabs

  return (
    <ProfileContext.Provider value={profile}>
      <div className="flex min-h-screen bg-gray-50">

        {/* Sidebar */}
        <div className={`${collapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shadow-sm`}>

          {/* Logo */}
          <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between">
            {!collapsed && (
              <div>
                <p className="font-bold text-sm text-gray-900 tracking-widest">NAVRATAN</p>
                <p className="text-gray-400 text-xs">Flow Management</p>
              </div>
            )}
            <button onClick={() => setCollapsed(p => !p)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded transition text-lg">
              {collapsed ? '›' : '‹'}
            </button>
          </div>

          {/* Profile */}
          {!collapsed && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: config.bg, color: config.color }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{profile.name}</p>
                  <p className="text-xs font-medium truncate" style={{ color: config.color }}>{config.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-3 px-2">

            <NavSection label="MAIN" collapsed={collapsed}>
              {mainTabs.filter(t => userTabs.includes(t)).map(tab => (
                <NavItem key={tab} tab={tab} collapsed={collapsed}
                  active={location.pathname === TAB_ROUTES[tab]}
                  color={config.color} />
              ))}
            </NavSection>

            {isManager && manageTabs.some(t => userTabs.includes(t)) && (
              <NavSection label="MANAGEMENT" collapsed={collapsed}>
                {manageTabs.filter(t => userTabs.includes(t)).map(tab => (
                  <NavItem key={tab} tab={tab} collapsed={collapsed}
                    active={location.pathname === TAB_ROUTES[tab]}
                    color={config.color} />
                ))}
              </NavSection>
            )}

            {adminTabs.some(t => userTabs.includes(t)) && (
              <NavSection label="ADMIN" collapsed={collapsed}>
                {adminTabs.filter(t => userTabs.includes(t)).map(tab => (
                  <NavItem key={tab} tab={tab} collapsed={collapsed}
                    active={location.pathname === TAB_ROUTES[tab]}
                    color={config.color} />
                ))}
              </NavSection>
            )}
          </div>

          {/* Sign out */}
          <div className="p-3 border-t border-gray-100">
            <button onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition text-sm">
              <span className="text-base w-5 text-center flex-shrink-0">↩</span>
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {/* Top bar */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
              {TAB_LABELS[location.pathname.replace('/', '')] || 'FMS'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: config.bg, color: config.color }}>
                {config.label}
              </span>
              <span className="text-sm text-gray-500">{profile.name}</span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </ProfileContext.Provider>
  )
}

function NavSection({ label, collapsed, children }: {
  label: string; collapsed: boolean; children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="text-xs text-gray-400 font-bold tracking-widest px-3 mb-1">{label}</p>
      )}
      {children}
    </div>
  )
}

function NavItem({ tab, collapsed, active, color }: {
  tab: string; collapsed: boolean; active: boolean; color: string
}) {
  return (
    <Link to={TAB_ROUTES[tab]}
      title={collapsed ? TAB_LABELS[tab] : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition font-medium mb-0.5 ${
        active ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
      style={active ? { backgroundColor: color } : {}}>
      <span className="text-sm w-5 text-center flex-shrink-0">{TAB_ICONS[tab] || '·'}</span>
      {!collapsed && <span>{TAB_LABELS[tab]}</span>}
    </Link>
  )
}