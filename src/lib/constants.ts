import type { Role } from './types'

export const ROLE_CONFIG: Record<Role, {
  label: string
  color: string
  bg: string
  tabs: string[]
}> = {
  owner:          { label: 'Owner',            color: '#3C3489', bg: '#EEEDFE', tabs: ['checklist','fms','compliance','mis'] },
  ea:             { label: 'EA',               color: '#0F6E56', bg: '#E1F5EE', tabs: ['checklist','fms','compliance','mis'] },
  crm:            { label: 'CRM',              color: '#993C1D', bg: '#FAECE7', tabs: ['checklist','fms'] },
  'pc-production':{ label: 'PC · Production',  color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','fms'] },
  'pc-rigid':     { label: 'PC · Rigid',       color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','fms'] },
  'pc-dispatch':  { label: 'PC · Dispatch',    color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','fms'] },
  'pc-purchase':  { label: 'PC · Purchase',    color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','fms'] },
  'pc-finance':   { label: 'PC · Finance',     color: '#854F0B', bg: '#FAEEDA', tabs: ['checklist','fms','compliance'] },
  'pc-admin':     { label: 'PC · Admin',       color: '#854F0B', bg: '#FAEEDA', tabs: ['checklist','compliance'] },
  mis:            { label: 'MIS In-Charge',    color: '#26215C', bg: '#EEEDFE', tabs: ['checklist','fms','compliance','mis'] },
}

export const TAB_LABELS: Record<string, string> = {
  checklist:  'Daily CL',
  fms:        'FMS Tracker',
  mis:        'MIS Dashboard',
  compliance: 'Compliance',
}

export const TAB_ROUTES: Record<string, string> = {
  checklist:  '/checklist',
  fms:        '/fms',
  mis:        '/mis',
  compliance: '/compliance',
}