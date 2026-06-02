import { createContext, useContext, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import { ROLE_CONFIG, TAB_LABELS, TAB_ROUTES } from '../lib/constants'
import type { Profile } from '../lib/types'
import { supabase } from '../lib/supabase'
import {
  CheckSquare, ListTodo, Users, Briefcase, Building2,
  GitBranch, Shield, BarChart2, TrendingUp, Layers,
  UserCircle, Settings, Database, ClipboardList,
  Sun, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'

export const ProfileContext = createContext<Profile | null>(null)

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside Layout')
  return ctx
}

const TAB_ICON_MAP: Record<string, React.ReactNode> = {
  checklist:   <CheckSquare size={15} />,
  mytasks:     <ListTodo size={15} />,
  deptcl:      <Users size={15} />,
  jobs:        <Briefcase size={15} />,
  org:         <Building2 size={15} />,
  fms:         <GitBranch size={15} />,
  compliance:  <Shield size={15} />,
  mis:         <BarChart2 size={15} />,
  misview:     <TrendingUp size={15} />,
  deptview:    <Layers size={15} />,
  empview:     <UserCircle size={15} />,
  processview: <Settings size={15} />,
  masters:     <Database size={15} />,
  tasks:       <ClipboardList size={15} />,
}

export default function Layout({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { signOut } = useAuth()
  const location = useLocation()
  const config = ROLE_CONFIG[profile.role]
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)

  const isManager = ['owner', 'ea', 'mis'].includes(profile.role)
  const mainTabs = ['checklist', 'mytasks', 'deptcl', 'jobs', 'org', 'fms', 'compliance']
  const manageTabs = ['mis', 'misview', 'deptview', 'empview', 'processview']
  const adminTabs = ['masters', 'tasks']
  const userTabs = config.tabs

  const sb = dark ? '#0D0D0D' : '#fff'
  const sbBorder = dark ? '#1A1A1A' : '#E5E7EB'
  const sbText = dark ? '#F5F5F5' : '#111'
  const sbSub = dark ? '#555' : '#888'
  const sbLabel = dark ? '#444' : '#9CA3AF'
  const sbItem = dark ? '#666' : '#6B7280'
  const contentBg = dark ? '#111' : '#F8F9FA'
  const contentText = dark ? '#F5F5F5' : '#111'

  return (
    <ProfileContext.Provider value={profile}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{
          width: collapsed ? 52 : 210, flexShrink: 0,
          backgroundColor: sb, borderRight: `1px solid ${sbBorder}`,
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s', position: 'relative',
        }}>

          {/* Logo */}
          <div style={{
            padding: collapsed ? '14px 10px' : '14px 16px',
            borderBottom: `1px solid ${sbBorder}`,
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between', gap: 10
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
  <img src="/navratan_logo.png" style={{ width: 75, height: 75, objectFit: 'contain' }} />
  {!collapsed && (
    <>
      <p style={{ color: sbText, fontWeight: 800, fontSize: 13, margin: '6px 0 0', letterSpacing: 1, textAlign: 'center' }}>NAVRATAN OFFSET</p>
      <p style={{ color: sbSub, fontSize: 10, margin: '2px 0 0', textAlign: 'center' }}>Business Operating System</p>
    </>
  )}
</div>
            {!collapsed && (
              <button onClick={() => setCollapsed(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: sbSub, padding: 4, display: 'flex', alignItems: 'center',
              }}>
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Collapsed expand button */}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{
              margin: '8px auto', background: 'none', border: `1px solid ${sbBorder}`,
              borderRadius: 6, cursor: 'pointer', color: sbSub, padding: '4px 6px',
              display: 'flex', alignItems: 'center',
            }}>
              <ChevronRight size={14} />
            </button>
          )}

          {/* Nav */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', scrollbarWidth: 'none' }}>

            <NavSection label="MAIN" collapsed={collapsed} labelColor={sbLabel}>
              {mainTabs.filter(t => userTabs.includes(t)).map(tab => (
                <NavItem key={tab} tab={tab} collapsed={collapsed}
                  active={location.pathname === TAB_ROUTES[tab]}
                  dark={dark} itemColor={sbItem}
                  icon={TAB_ICON_MAP[tab]} />
              ))}
            </NavSection>

            {isManager && manageTabs.some(t => userTabs.includes(t)) && (
              <NavSection label="MANAGEMENT" collapsed={collapsed} labelColor={sbLabel}>
                {manageTabs.filter(t => userTabs.includes(t)).map(tab => (
                  <NavItem key={tab} tab={tab} collapsed={collapsed}
                    active={location.pathname === TAB_ROUTES[tab]}
                    dark={dark} itemColor={sbItem}
                    icon={TAB_ICON_MAP[tab]} />
                ))}
              </NavSection>
            )}

            {adminTabs.some(t => userTabs.includes(t)) && (
              <NavSection label="ADMIN" collapsed={collapsed} labelColor={sbLabel}>
                {adminTabs.filter(t => userTabs.includes(t)).map(tab => (
                  <NavItem key={tab} tab={tab} collapsed={collapsed}
                    active={location.pathname === TAB_ROUTES[tab]}
                    dark={dark} itemColor={sbItem}
                    icon={TAB_ICON_MAP[tab]} />
                ))}
              </NavSection>
            )}
          </div>

          {/* Bottom */}
          <div style={{ padding: '8px', borderTop: `1px solid ${sbBorder}` }}>
            {!collapsed && (
              <p style={{ color: sbSub, fontSize: 11, padding: '4px 8px', margin: '0 0 4px 0' }}>{profile.name}</p>
            )}
            <SidebarBtn icon={<Sun size={14} />} label="Light / Dark"
              collapsed={collapsed} onClick={() => setDark(p => !p)} color={sbItem} />
            <SidebarBtn icon={<LogOut size={14} />} label="Sign Out"
              collapsed={collapsed} onClick={signOut} color={sbItem} />
            {!collapsed && (
              <p style={{ color: sbSub, fontSize: 9, padding: '6px 8px 0', margin: 0 }}>v1.0</p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className={dark ? 'dark' : ''} style={{
          flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column',
          backgroundColor: contentBg, color: contentText,
        }}>
          {/* Top bar */}
          <div style={{
            height: 52, backgroundColor: dark ? '#1A1A1A' : '#fff',
            borderBottom: `1px solid ${dark ? '#2A2A2A' : '#E5E7EB'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', flexShrink: 0,
          }}>
            <p style={{ color: contentText, fontSize: 15, fontWeight: 700, margin: 0 }}>
              {TAB_LABELS[location.pathname.replace('/', '')] || 'FMS'}
            </p>
            <span style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
              backgroundColor: config.color + '18', color: config.color,
            }}>{config.label}</span>
          </div>

          {location.pathname === '/deptcl' ? (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left dept nav */}
              <div style={{
                width: 140, flexShrink: 0, borderRight: `1px solid ${dark ? '#2A2A2A' : '#E5E7EB'}`,
                backgroundColor: dark ? '#1A1A1A' : '#F3F4F6',
                padding: '12px 8px', overflowY: 'auto',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px 4px' }}>Departments</p>
                <DeptSubNav dark={dark} vertical={true} />
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', height: '100%' }}>
                {children}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, width: '100%', padding: '24px', overflowY: 'auto' }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </ProfileContext.Provider>
  )
}

function NavSection({ label, collapsed, labelColor, children }: {
  label: string; collapsed: boolean; labelColor: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {!collapsed && (
        <p style={{
          color: labelColor, fontSize: 10, fontWeight: 700,
          letterSpacing: 1.5, padding: '0 8px', margin: '0 0 4px'
        }}>{label}</p>
      )}
      {children}
    </div>
  )
}

function NavItem({ tab, collapsed, active, dark, itemColor, icon }: {
  tab: string; collapsed: boolean; active: boolean
  dark: boolean; itemColor: string; icon: React.ReactNode
}) {
  return (
    <Link to={TAB_ROUTES[tab]}
      title={collapsed ? TAB_LABELS[tab] : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: collapsed ? '9px' : '8px 10px',
        borderRadius: 7, marginBottom: 2,
        fontSize: 13, fontWeight: active ? 600 : 400,
        textDecoration: 'none',
        backgroundColor: active ? (dark ? '#1A1A1A' : '#F3F4F6') : 'transparent',
        color: active ? (dark ? '#F5F5F5' : '#111') : itemColor,
        borderLeft: active ? '2px solid #8B1A1A' : '2px solid transparent',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      {!collapsed && <span>{TAB_LABELS[tab]}</span>}
    </Link>
  )
}

function DeptSubNav({ dark, vertical = false }: { dark: boolean; vertical?: boolean }) {
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    supabase.from('departments').select('id,name').eq('is_active', true).order('name')
      .then(({ data }) => {
        setDepts(data || [])
        if (data && data.length > 0) setSelected(data[0].name)
      })
  }, [])

  // Broadcast selected dept via custom event so DeptCLPage can listen
  function selectDept(name: string) {
    setSelected(name)
    window.dispatchEvent(new CustomEvent('dept-selected', { detail: name }))
  }

  if (vertical) return (
    <>
      {depts.map(d => (
        <button key={d.id} onClick={() => selectDept(d.name)} style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '8px 10px', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer', borderRadius: 6,
          backgroundColor: selected === d.name ? '#111' : 'transparent',
          color: selected === d.name ? '#fff' : '#6B7280',
          marginBottom: 2,
        }}>{d.name}</button>
      ))}
    </>
  )

  return (
    <div style={{
      borderBottom: `1px solid ${dark ? '#2A2A2A' : '#E5E7EB'}`,
      backgroundColor: dark ? '#1A1A1A' : '#fff',
      padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto',
      flexShrink: 0,
    }}>
      {depts.map(d => (
        <button key={d.id} onClick={() => selectDept(d.name)} style={{
          padding: '8px 14px', fontSize: 13, fontWeight: 600,
          border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          borderBottom: selected === d.name ? '2px solid #111' : '2px solid transparent',
          color: selected === d.name ? (dark ? '#fff' : '#111') : '#9CA3AF',
          marginBottom: -1,
        }}>{d.name}</button>
      ))}
    </div>
  )
}

function SidebarBtn({ icon, label, collapsed, onClick, color }: {
  icon: React.ReactNode; label: string; collapsed: boolean; onClick: () => void; color: string
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center',
      gap: 9, padding: collapsed ? '9px' : '8px 10px',
      borderRadius: 7, background: 'none', border: 'none',
      color, cursor: 'pointer', fontSize: 12, fontWeight: 400,
      justifyContent: collapsed ? 'center' : 'flex-start',
      marginBottom: 2,
    }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  )
}