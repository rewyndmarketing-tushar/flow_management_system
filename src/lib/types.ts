export type Role =
  | 'owner' | 'ea' | 'crm' | 'mis'
  | 'pc-production' | 'pc-rigid' | 'pc-dispatch'
  | 'pc-purchase' | 'pc-finance' | 'pc-admin'

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface Profile {
  id: string
  user_id: string
  name: string
  role: Role
}

export interface ChecklistTemplate {
  id: string
  role: Role
  task: string
  tat: string
  frequency: Frequency
  order: number
}

export interface ChecklistEntry {
  id: string
  template_id: string
  user_id: string
  date: string
  done: boolean
  updated_at: string
}

export interface FMSStep {
  number: number
  what: string
  who: string
  when_tat: string
  how: string
}

export interface FMSProcess {
  id: string
  code: string
  name: string
  department: string
  steps: FMSStep[]
}

export interface FMSEntry {
  id: string
  process_id: string
  ref_no: string
  date: string
  client: string
  contact: string
  step_1_pln: string | null; step_1_act: string | null
  step_2_pln: string | null; step_2_act: string | null
  step_3_pln: string | null; step_3_act: string | null
  step_4_pln: string | null; step_4_act: string | null
  step_5_pln: string | null; step_5_act: string | null
  step_6_pln: string | null; step_6_act: string | null
  step_7_pln: string | null; step_7_act: string | null
  created_by: string
  fms_processes?: FMSProcess
}

export interface ComplianceItem {
  id: string
  task: string
  owner_role: Role
  due_date: string
  frequency: Frequency
  contact_person: string | null
  last_done: string | null
}

export interface KRAScore {
  id: string
  user_id: string
  week_start: string
  qty_planned: number; qty_actual: number
  qual_planned: number; qual_actual: number
  time_planned: number; time_actual: number
  cost_planned: number; cost_actual: number
  profiles?: Profile
}