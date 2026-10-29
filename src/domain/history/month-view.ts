import type {
  DayKind,
  DayOverride,
  DayOverrideKind,
  TimeEntry,
  WorkDay,
} from '@/domain/entities'
import { accumulateBalances, type BalanceTotals } from '@/domain/calculation'
import {
  formatBalanceMinutes,
  formatDurationMinutes,
  punchStripFromEntries,
} from '@/domain/punching'

/** Alinhado a StatusTone da UI, sem depender de React. */
export type HistoryStatusTone =
  | 'idle'
  | 'working'
  | 'on_break'
  | 'done'
  | 'incomplete'
  | 'error'

export interface MonthQuery {
  year: number
  month: number
}

export interface HistoryDayRow {
  dateKey: string
  dateLabel: string
  weekdayLabel: string
  clockIn: string
  breakStart: string
  breakEnd: string
  clockOut: string
  workedLabel: string
  expectedLabel: string
  balanceLabel: string
  workedMinutes: number
  expectedMinutes: number
  balanceMinutes: number
  kind: DayKind | 'empty'
  situationLabel: string
  statusTone: HistoryStatusTone
  isComplete: boolean
  isIncomplete: boolean
  hasRecords: boolean
  overrideKind?: DayOverrideKind
}

export interface MonthSummary {
  totals: BalanceTotals
  workedMinutes: number
  expectedMinutes: number
  completeDays: number
  incompleteDays: number
  cards: Array<{ id: string; label: string; value: string; caption: string }>
}

const KIND_LABEL: Record<DayKind, string> = {
  complete: 'Completa',
  incomplete: 'Incompleta',
  no_records: 'Sem registros',
  rest: 'Descanso',
  day_off: 'Folga',
  vacation: 'Férias',
  holiday: 'Feriado',
  excused: 'Abono',
  confirmed_absence: 'Falta confirmada',
}

export const OVERRIDE_LABELS: Record<DayOverrideKind, string> = {
  rest: 'Descanso',
  day_off: 'Folga',
  vacation: 'Férias',
  holiday: 'Feriado',
  excused: 'Abono',
  confirmed_absence: 'Falta confirmada',
}

export function kindToStatusTone(kind: DayKind | 'empty'): HistoryStatusTone {
  switch (kind) {
    case 'complete':
      return 'done'
    case 'incomplete':
      return 'incomplete'
    case 'no_records':
    case 'empty':
      return 'idle'
    case 'confirmed_absence':
      return 'error'
    case 'rest':
    case 'day_off':
    case 'vacation':
    case 'holiday':
    case 'excused':
      return 'on_break'
    default:
      return 'idle'
  }
}

function formatLocalTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function daysInMonth(year: number, month: number): string[] {
  const count = new Date(year, month, 0).getDate()
  const keys: string[] = []
  for (let day = 1; day <= count; day += 1) {
    keys.push(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    )
  }
  return keys
}

function labelDate(dateKey: string): { dateLabel: string; weekdayLabel: string } {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  return {
    dateLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date),
    weekdayLabel: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date),
  }
}

/**
 * Monta as linhas do mês (todos os dias) a partir de WorkDays, entradas e overrides.
 */
export function buildMonthHistoryRows(input: {
  year: number
  month: number
  workDays: WorkDay[]
  entriesByDate: Map<string, TimeEntry[]>
  overridesByDate: Map<string, DayOverride>
}): HistoryDayRow[] {
  const workDayByDate = new Map(input.workDays.map((day) => [day.dateKey, day]))

  return daysInMonth(input.year, input.month).map((dateKey) => {
    const workDay = workDayByDate.get(dateKey)
    const entries = input.entriesByDate.get(dateKey) ?? []
    const override = input.overridesByDate.get(dateKey)
    const strip = punchStripFromEntries(entries)
    const { dateLabel, weekdayLabel } = labelDate(dateKey)

    const kind: DayKind | 'empty' = workDay?.kind ?? (entries.length > 0 ? 'incomplete' : 'empty')
    const workedMinutes = workDay?.workedMinutes ?? 0
    const expectedMinutes = workDay?.expectedMinutes ?? 0
    const balanceMinutes = workDay?.balanceMinutes ?? 0

    const situationLabel = override
      ? OVERRIDE_LABELS[override.kind]
      : kind === 'empty'
        ? '—'
        : KIND_LABEL[kind]

    return {
      dateKey,
      dateLabel,
      weekdayLabel,
      clockIn: formatLocalTime(strip[0]?.occurredAt),
      breakStart: formatLocalTime(strip[1]?.occurredAt),
      breakEnd: formatLocalTime(strip[2]?.occurredAt),
      clockOut: formatLocalTime(strip[3]?.occurredAt),
      workedLabel: formatDurationMinutes(workedMinutes),
      expectedLabel: formatDurationMinutes(expectedMinutes),
      balanceLabel: formatBalanceMinutes(balanceMinutes),
      workedMinutes,
      expectedMinutes,
      balanceMinutes,
      kind,
      situationLabel,
      statusTone: kindToStatusTone(kind),
      isComplete: kind === 'complete',
      isIncomplete: kind === 'incomplete',
      hasRecords: entries.length > 0 || Boolean(workDay) || Boolean(override),
      overrideKind: override?.kind,
    }
  })
}

export function buildMonthSummary(rows: HistoryDayRow[]): MonthSummary {
  const material = rows.filter((row) => row.kind !== 'empty')
  const asWorkDays = material.map((row) => ({
    balanceMinutes: row.balanceMinutes,
  })) as WorkDay[]

  const totals = accumulateBalances(asWorkDays)
  const workedMinutes = material.reduce((sum, row) => sum + row.workedMinutes, 0)
  const expectedMinutes = material.reduce((sum, row) => sum + row.expectedMinutes, 0)
  const completeDays = material.filter((row) => row.isComplete).length
  const incompleteDays = material.filter((row) => row.isIncomplete).length

  return {
    totals,
    workedMinutes,
    expectedMinutes,
    completeDays,
    incompleteDays,
    cards: [
      {
        id: 'worked',
        label: 'Total trabalhado',
        value: formatDurationMinutes(workedMinutes),
        caption: `${completeDays} completa(s) · ${incompleteDays} incompleta(s)`,
      },
      {
        id: 'expected',
        label: 'Total esperado',
        value: formatDurationMinutes(expectedMinutes),
        caption: 'Carga dos dias materializados',
      },
      {
        id: 'credits',
        label: 'Créditos',
        value: formatDurationMinutes(totals.creditsMinutes),
        caption: 'Somas dos saldos positivos',
      },
      {
        id: 'debits',
        label: 'Débitos',
        value: formatDurationMinutes(totals.debitsMinutes),
        caption: 'Somas dos |saldos| negativos',
      },
      {
        id: 'net',
        label: 'Saldo líquido',
        value: formatBalanceMinutes(totals.netMinutes),
        caption: 'Créditos − débitos',
      },
    ],
  }
}

export function monthLabelPt(year: number, month: number): string {
  const date = new Date(year, month - 1, 1, 12)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}
