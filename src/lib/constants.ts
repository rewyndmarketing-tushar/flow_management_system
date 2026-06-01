import type { Role } from './types'

export const ROLE_CONFIG: Record<Role, {
  label: string
  color: string
  bg: string
  tabs: string[]
}> = {
  owner:          { label: 'Owner',            color: '#3C3489', bg: '#EEEDFE', tabs: ['checklist','mytasks','deptcl','jobs','org','fms','compliance','mis','misview','deptview','empview','processview','masters','tasks'] },
  ea:             { label: 'EA',               color: '#0F6E56', bg: '#E1F5EE', tabs: ['checklist','mytasks','deptcl','jobs','org','fms','compliance','mis','misview','deptview','empview','processview','masters','tasks'] },
  crm:            { label: 'CRM',              color: '#993C1D', bg: '#FAECE7', tabs: ['checklist','mytasks','deptcl','jobs','fms'] },
  'pc-production':{ label: 'PC · Production',  color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','mytasks','deptcl','jobs','fms'] },
  'pc-rigid':     { label: 'PC · Rigid',       color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','mytasks','deptcl','jobs','fms'] },
  'pc-dispatch':  { label: 'PC · Dispatch',    color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','mytasks','deptcl','jobs','fms'] },
  'pc-purchase':  { label: 'PC · Purchase',    color: '#185FA5', bg: '#E6F1FB', tabs: ['checklist','mytasks','deptcl','jobs','fms'] },
  'pc-finance':   { label: 'PC · Finance',     color: '#854F0B', bg: '#FAEEDA', tabs: ['checklist','mytasks','deptcl','jobs','fms','compliance'] },
  'pc-admin':     { label: 'PC · Admin',       color: '#854F0B', bg: '#FAEEDA', tabs: ['checklist','mytasks','deptcl','compliance'] },
  mis:            { label: 'MIS In-Charge',    color: '#26215C', bg: '#EEEDFE', tabs: ['checklist','mytasks','deptcl','jobs','org','fms','compliance','mis','misview','deptview','empview','processview','masters','tasks'] },
}

export const TAB_LABELS: Record<string, string> = {
  checklist:    'Daily CL',
  mytasks:      'My Tasks',
  deptcl:       'Dept Checklist',
  jobs:         'Jobs',
  org:          'Organisation',
  fms:          'FMS',
  compliance:   'Compliance',
  mis:          'MIS Dashboard',
  misview:      'MIS View',
  deptview:     'Dept View',
  empview:      'Employee View',
  processview:  'Process View',
  masters:      'Masters',
  tasks:        'Task Manager',
}

export const TAB_ROUTES: Record<string, string> = {
  checklist:    '/checklist',
  mytasks:      '/mytasks',
  deptcl:       '/deptcl',
  jobs:         '/jobs',
  org:          '/org',
  fms:          '/fms',
  compliance:   '/compliance',
  mis:          '/mis',
  misview:      '/misview',
  deptview:     '/deptview',
  empview:      '/empview',
  processview:  '/processview',
  masters:      '/masters',
  tasks:        '/tasks',
}