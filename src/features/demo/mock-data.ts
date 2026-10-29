export type DemoPunchStatus = 'idle' | 'working' | 'on_break' | 'done' | 'error'

export interface DemoSummary {
  id: string
  label: string
  value: string
  caption: string
}

export interface DemoPunch {
  type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out'
  label: string
  time: string | null
}

export interface DemoDayRow {
  id: string
  dateLabel: string
  dateIso: string
  clockIn: string
  breakStart: string
  breakEnd: string
  clockOut: string
  worked: string
  status: DemoPunchStatus
}

/** Totais derivados dos mesmos valores exibidos nos cards. */
export const demoTodaySummaries: DemoSummary[] = [
  {
    id: 'worked',
    label: 'Trabalhado hoje',
    value: '7h 05m',
    caption: '45m abaixo da jornada de 8h',
  },
  {
    id: 'break',
    label: 'Intervalo',
    value: '1h 01m',
    caption: '1m acima do planejado (1h)',
  },
  {
    id: 'balance',
    label: 'Saldo do dia',
    value: '−45m',
    caption: 'Em relação à carga esperada',
  },
  {
    id: 'status',
    label: 'Status',
    value: 'Em jornada',
    caption: 'Saída ainda não registrada',
  },
]

export const demoPunchStrip: DemoPunch[] = [
  { type: 'clock_in', label: 'Entrada', time: '08:02' },
  { type: 'break_start', label: 'Intervalo', time: '12:01' },
  { type: 'break_end', label: 'Retorno', time: '13:02' },
  { type: 'clock_out', label: 'Saída', time: null },
]

export const demoHistoryRows: DemoDayRow[] = [
  {
    id: '2026-10-27',
    dateLabel: '27 out',
    dateIso: '2026-10-27',
    clockIn: '08:01',
    breakStart: '12:00',
    breakEnd: '13:00',
    clockOut: '17:05',
    worked: '8h 04m',
    status: 'done',
  },
  {
    id: '2026-10-26',
    dateLabel: '26 out',
    dateIso: '2026-10-26',
    clockIn: '08:14',
    breakStart: '12:05',
    breakEnd: '13:10',
    clockOut: '17:02',
    worked: '7h 43m',
    status: 'done',
  },
  {
    id: '2026-10-25',
    dateLabel: '25 out',
    dateIso: '2026-10-25',
    clockIn: '09:02',
    breakStart: '12:30',
    breakEnd: '13:30',
    clockOut: '18:10',
    worked: '8h 08m',
    status: 'done',
  },
  {
    id: '2026-10-24',
    dateLabel: '24 out',
    dateIso: '2026-10-24',
    clockIn: '08:00',
    breakStart: '—',
    breakEnd: '—',
    clockOut: '—',
    worked: '—',
    status: 'error',
  },
]

export const demoEmptyMonthLabel = 'Novembro 2026'

export const demoSettings = {
  displayName: 'Ana Ribeiro',
  workdayStart: '08:00',
  workdayEnd: '17:00',
  breakMinutes: 60,
  expectedDailyMinutes: 480,
  referenceDate: '2026-10-28',
}
