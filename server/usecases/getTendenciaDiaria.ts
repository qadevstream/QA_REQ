import { createClient } from '@/lib/supabase/server'

export interface TendenciaDiaItem {
  fecha: string   // 'YYYY-MM-DD'
  total: number
}

export interface TendenciaDiariaResult {
  items: TendenciaDiaItem[]
  periodoLabel: string
  totalPeriodo: number
}

function getCurrentPeriodDates(): { from: Date; to: Date } {
  const now = new Date()
  const d = now.getDate()

  let startMonth = now.getMonth()
  let startYear = now.getFullYear()

  if (d < 3) {
    startMonth -= 1
    if (startMonth < 0) { startMonth = 11; startYear -= 1 }
  }

  const from = new Date(startYear, startMonth, 3)
  const to   = new Date(startYear, startMonth + 1, 2, 23, 59, 59, 999)
  return { from, to }
}

const MESES: Record<number, string> = {
  0:'Ene',1:'Feb',2:'Mar',3:'Abr',4:'May',5:'Jun',
  6:'Jul',7:'Ago',8:'Set',9:'Oct',10:'Nov',11:'Dic',
}

function fmt(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export async function getTendenciaDiaria(): Promise<TendenciaDiariaResult> {
  const { from, to } = getCurrentPeriodDates()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requirements')
    .select('id, created_at')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at')

  if (error) throw new Error(error.message)

  // Build a map day → count, pre-filling every day in the period up to today
  const dayMap = new Map<string, number>()
  const today = new Date()
  const end = to < today ? to : today

  const cursor = new Date(from)
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    dayMap.set(key, 0)
    cursor.setDate(cursor.getDate() + 1)
  }

  for (const row of data ?? []) {
    const key = (row.created_at as string).slice(0, 10)
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
  }

  const items: TendenciaDiaItem[] = Array.from(dayMap.entries()).map(([fecha, total]) => ({ fecha, total }))

  return {
    items,
    periodoLabel: `${fmt(from)} – ${fmt(to)}`,
    totalPeriodo: (data ?? []).length,
  }
}
