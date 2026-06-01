import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ROLE_CONFIG } from '../../lib/constants'

export interface OrgMember {
  id: string
  user_id: string
  name: string
  role: string
  total: number
  done: number
  pct: number
  pending: number
  activeJobs: number
}

export interface OrgDepartment {
  name: string
  members: OrgMember[]
  totalTasks: number
  doneTasks: number
  pct: number
}

export interface OrgFunction {
  name: string
  departments: OrgDepartment[]
  totalTasks: number
  doneTasks: number
  pct: number
}

const FUNCTION_MAP: Record<string, string[]> = {
  'Sales & Marketing': ['owner', 'crm', 'ea'],
  'Operations':        ['pc-production', 'pc-rigid', 'pc-dispatch'],
  'Finance & Accounts':['pc-finance'],
  'HR & Admin':        ['pc-admin', 'pc-hr'],
  'Systems':           ['mis'],
}

export function useOrg() {
  const [orgData, setOrgData] = useState<OrgFunction[]>([])
  const [loading, setLoading] = useState(true)
  const [totalTasks, setTotalTasks] = useState(0)
  const [totalDone, setTotalDone] = useState(0)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles').select('*')
    if (!profiles?.length) { setLoading(false); return }

    const members: OrgMember[] = []

    for (const profile of profiles) {
      const { data: tmpl } = await supabase
        .from('checklist_templates').select('id')
        .eq('role', profile.role).eq('frequency', 'daily')
      const total = tmpl?.length || 0

      let done = 0
      if (total > 0) {
        const { data: ent } = await supabase
          .from('checklist_entries').select('id')
          .in('template_id', tmpl!.map(t => t.id))
          .eq('user_id', profile.user_id).eq('date', today).eq('done', true)
        done = ent?.length || 0
      }

      const { data: activeJobs } = await supabase
        .from('job_steps').select('id')
        .eq('assigned_role', profile.role)
        .eq('status', 'pending')

      members.push({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        role: profile.role,
        total,
        done,
        pct: total ? Math.round(done / total * 100) : 0,
        pending: total - done,
        activeJobs: activeJobs?.length || 0
      })
    }

    const functions: OrgFunction[] = Object.entries(FUNCTION_MAP).map(([funcName, roles]) => {
      const funcMembers = members.filter(m => roles.includes(m.role))
      const depts: OrgDepartment[] = []

      roles.forEach(role => {
        const roleMembers = funcMembers.filter(m => m.role === role)
        if (roleMembers.length) {
          const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]
          const deptTotal = roleMembers.reduce((a, m) => a + m.total, 0)
          const deptDone = roleMembers.reduce((a, m) => a + m.done, 0)
          depts.push({
            name: config?.label || role,
            members: roleMembers,
            totalTasks: deptTotal,
            doneTasks: deptDone,
            pct: deptTotal ? Math.round(deptDone / deptTotal * 100) : 0
          })
        }
      })

      const funcTotal = funcMembers.reduce((a, m) => a + m.total, 0)
      const funcDone = funcMembers.reduce((a, m) => a + m.done, 0)

      return {
        name: funcName,
        departments: depts,
        totalTasks: funcTotal,
        doneTasks: funcDone,
        pct: funcTotal ? Math.round(funcDone / funcTotal * 100) : 0
      }
    }).filter(f => f.departments.length > 0)

    const tt = members.reduce((a, m) => a + m.total, 0)
    const td = members.reduce((a, m) => a + m.done, 0)
    setTotalTasks(tt)
    setTotalDone(td)
    setOrgData(functions)
    setLoading(false)
  }

  return { orgData, loading, totalTasks, totalDone, reload: load }
}