import type { TimeEntry, WorkDay, WorkSchedule } from '@/domain/entities'
import type { AbsencePolicy } from '@/domain/entities'
import type { BalanceTotals } from '@/domain/calculation'

import { formatBalanceMinutes, formatDurationMinutes } from './format-duration'
import { formatLongDatePt } from './local-datetime'
import {
  deriveJourneyStatus,
  derivePrimaryPunch,
  firstClockInIso,
  punchStripFromEntries,
  type JourneyStatus,
  type NextPunch,
} from './next-punch'
import { calculateLiveWorkDay } from './register-punch'

export interface DashboardSummaryCard {
  id: string
  label: string
  value: string
  caption: string
}

export interface DashboardViewModel {
  dateKey: string
  dateLabel: string
  status: JourneyStatus
  nextPunch: NextPunch
  firstClockInLabel: string
  punchStrip: ReturnType<typeof punchStripFromEntries>
  activePunchType: NextPunch['type']
  summaries: DashboardSummaryCard[]
  monthSummaries: DashboardSummaryCard[]
  balanceIsProvisional: boolean
  live: WorkDay | null
}

const STATUS_LABEL: Record<JourneyStatus, string> = {
  idle: 'Fora de jornada',
  working: 'Em jornada',
  on_break: 'Em intervalo',
  done: 'Jornada fechada',
  incomplete: 'Jornada incompleta',
  invalid: 'Marcações inválidas',
}

function formatClockLabel(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function buildDashboardViewModel(input: {
  dateKey: string
  entries: TimeEntry[]
  schedule: WorkSchedule
  persistedDay: WorkDay | null
  absencePolicy?: AbsencePolicy
  asOfIso: string
  monthTotals: BalanceTotals
  monthExpectedMinutes: number
  monthWorkedMinutes: number
}): DashboardViewModel {
  const status = deriveJourneyStatus(input.entries)
  const nextPunch = derivePrimaryPunch(input.entries)
  const firstIn = firstClockInIso(input.entries)
  const punchStrip = punchStripFromEntries(input.entries)

  const live = calculateLiveWorkDay({
    userId: input.schedule.userId,
    dateKey: input.dateKey,
    schedule: input.schedule,
    entries: input.entries,
    previous: input.persistedDay,
    absencePolicy: input.absencePolicy,
    asOfIso: input.asOfIso,
  })

  const expected =
    live?.expectedMinutes ??
    input.persistedDay?.expectedMinutes ??
    input.schedule.expectedDailyMinutes ??
    0

  const worked = live?.workedMinutes ?? 0
  // Sem registros o motor zera o saldo (sem débito automático).
  // Em jornada aberta o saldo provisório usa trabalhado − esperado.
  const balance =
    live != null
      ? status === 'working' || status === 'on_break'
        ? worked - expected
        : live.balanceMinutes
      : 0
  const balanceIsProvisional =
    status === 'working' || status === 'on_break' || status === 'incomplete'

  const expectedLabel = formatDurationMinutes(expected)
  const workedDelta = worked - expected
  const workedCaption =
    expected === 0
      ? STATUS_LABEL[status]
      : workedDelta === 0
        ? `Na jornada de ${expectedLabel}`
        : workedDelta < 0
          ? `${formatDurationMinutes(-workedDelta)} abaixo da jornada de ${expectedLabel}`
          : `${formatDurationMinutes(workedDelta)} acima da jornada de ${expectedLabel}`

  const summaries: DashboardSummaryCard[] = [
    {
      id: 'worked',
      label: 'Trabalhado hoje',
      value: formatDurationMinutes(worked),
      caption: workedCaption,
    },
    {
      id: 'expected',
      label: 'Jornada esperada',
      value: formatDurationMinutes(expected),
      caption: 'Carga do dia conforme a escala vigente',
    },
    {
      id: 'balance',
      label: balanceIsProvisional ? 'Saldo provisório' : 'Saldo do dia',
      value: formatBalanceMinutes(balance),
      caption: balanceIsProvisional
        ? 'Atualiza em tempo real · ainda não definitivo'
        : 'Em relação à carga esperada',
    },
    {
      id: 'first-in',
      label: 'Primeira entrada',
      value: formatClockLabel(firstIn),
      caption: STATUS_LABEL[status],
    },
  ]

  const monthSummaries: DashboardSummaryCard[] = [
    {
      id: 'month-worked',
      label: 'Trabalhado no mês',
      value: formatDurationMinutes(input.monthWorkedMinutes),
      caption: 'Soma dos dias materializados',
    },
    {
      id: 'month-expected',
      label: 'Esperado no mês',
      value: formatDurationMinutes(input.monthExpectedMinutes),
      caption: 'Carga acumulada dos dias com registro',
    },
    {
      id: 'month-net',
      label: 'Saldo líquido do mês',
      value: formatBalanceMinutes(input.monthTotals.netMinutes),
      caption: `${formatDurationMinutes(input.monthTotals.creditsMinutes)} crédito · ${formatDurationMinutes(input.monthTotals.debitsMinutes)} débito`,
    },
  ]

  return {
    dateKey: input.dateKey,
    dateLabel: formatLongDatePt(input.dateKey),
    status,
    nextPunch,
    firstClockInLabel: formatClockLabel(firstIn),
    punchStrip,
    activePunchType: nextPunch.type,
    summaries,
    monthSummaries,
    balanceIsProvisional,
    live,
  }
}
