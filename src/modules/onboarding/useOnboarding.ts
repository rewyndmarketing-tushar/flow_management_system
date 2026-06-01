import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface CompanyData {
  name: string
  industry: string
  products_services: string
}

export interface FunctionData {
  id?: string
  name: string
  selected: boolean
}

export interface DepartmentData {
  id?: string
  function_id?: string
  function_name: string
  name: string
}

export interface ProcessData {
  id?: string
  department_id?: string
  department_name: string
  name: string
  code: string
}

export interface TeamMemberData {
  name: string
  email: string
  role: string
}

export const DEFAULT_FUNCTIONS: FunctionData[] = [
  { name: 'Finance & Accounting', selected: true },
  { name: 'Purchase & Procurement', selected: true },
  { name: 'Marketing & Sales', selected: true },
  { name: 'Operations', selected: true },
  { name: 'Human Resources', selected: true },
  { name: 'Research & Development', selected: false },
  { name: 'Administration', selected: true },
]

export function useOnboarding() {
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  async function saveCompany(data: CompanyData) {
    setLoading(true)
    const { data: company, error } = await supabase
      .from('companies').insert(data).select().single()
    setLoading(false)
    if (error) throw error
    setCompanyId(company.id)
    return company
  }

  async function saveFunctions(companyId: string, functions: FunctionData[]) {
    setLoading(true)
    const selected = functions.filter(f => f.selected)
    const { data, error } = await supabase
      .from('business_functions')
      .insert(selected.map((f, i) => ({ company_id: companyId, name: f.name, order: i })))
      .select()
    setLoading(false)
    if (error) throw error
    return data
  }

  async function saveDepartments(departments: DepartmentData[]) {
    setLoading(true)
    const { data, error } = await supabase
      .from('departments')
      .insert(departments.map(d => ({ function_id: d.function_id, name: d.name })))
      .select()
    setLoading(false)
    if (error) throw error
    return data
  }

  async function saveProcesses(companyId: string, processes: ProcessData[]) {
    setLoading(true)
    const { data, error } = await supabase
      .from('fms_processes')
      .insert(processes.map(p => ({
        company_id: companyId,
        department_id: p.department_id,
        code: p.code,
        name: p.name,
        department: p.department_name,
        steps: []
      })))
      .select()
    setLoading(false)
    if (error) throw error
    return data
  }

  async function saveTeamMember(companyId: string, member: TeamMemberData) {
    setLoading(true)
    await supabase.from('profiles').insert({
      company_id: companyId,
      name: member.name,
      role: member.role,
      user_id: '00000000-0000-0000-0000-000000000000'
    })
    setLoading(false)
  }

  return { loading, companyId, saveCompany, saveFunctions, saveDepartments, saveProcesses }
}