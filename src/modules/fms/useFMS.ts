import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { FMSProcess, FMSEntry } from '../../lib/types'

export function useFMS() {
  const [processes, setProcesses] = useState<FMSProcess[]>([])
  const [entries, setEntries] = useState<FMSEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: procs } = await supabase
      .from('fms_processes').select('*').order('code')
    setProcesses(procs || [])
    const { data: ents } = await supabase
      .from('fms_entries')
      .select('*, fms_processes(code,name)')
      .order('date', { ascending: false })
    setEntries(ents || [])
    setLoading(false)
  }

  async function addEntry(entry: Omit<FMSEntry, 'id' | 'created_by' | 'fms_processes'>) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('fms_entries')
      .insert({ ...entry, created_by: user?.id })
      .select('*, fms_processes(code,name)')
      .single()
    if (data) setEntries(p => [data, ...p])
    return data
  }

  async function updateStep(entryId: string, field: string, value: string) {
    const { data } = await supabase
      .from('fms_entries')
      .update({ [field]: value || null })
      .eq('id', entryId)
      .select()
      .single()
    if (data) setEntries(p => p.map(e => e.id === data.id ? { ...e, ...data } : e))
  }

  return { processes, entries, loading, addEntry, updateStep, reload: load }
}