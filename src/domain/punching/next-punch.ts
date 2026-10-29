import type { PunchType, TimeEntry } from '@/domain/entities'
import { buildWorkSessions } from '@/domain/calculation'

/**
 * Estado da jornada derivado das marcações persistidas.
 */
export type JourneyStatus =
  'idle' | 'working' | 'on_break' | 'done' | 'incomplete' | 'invalid'

/**
 * Próximo tipo de marcação derivado só das marcações persistidas.
 * Não usa contador em memória — reconstrói o estado via motor de sessões.
 */
export type NextPunch =
  | { type: PunchType; label: string; disabled?: false }
  | { type: null; label: string; disabled: true; reason: string }

const LABELS: Record<PunchType, string> = {
  clock_in: 'Registrar entrada',
  break_start: 'Iniciar intervalo',
  break_end: 'Retornar do intervalo',
  clock_out: 'Registrar saída',
}

const SLOT_LABELS: Record<PunchType, string> = {
  clock_in: 'Entrada',
  break_start: 'Intervalo',
  break_end: 'Retorno',
  clock_out: 'Saída',
}

export function punchActionLabel(type: PunchType): string {
  return LABELS[type]
}

function sortEntries(entries: TimeEntry[]): TimeEntry[] {
  return [...entries].sort((a, b) => {
    const byTime = Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
    if (byTime !== 0) return byTime
    return a.id.localeCompare(b.id)
  })
}

/**
 * Botão principal: ciclo linear entrada → intervalo → retorno → saída,
 * depois nova entrada. Derivado exclusivamente dos registros.
 */
export function derivePrimaryPunch(entries: TimeEntry[]): NextPunch {
  const sorted = sortEntries(entries)
  const sessions = buildWorkSessions(sorted)

  if (!sessions.ok) {
    return {
      type: null,
      label: 'Corrigir marcações',
      disabled: true,
      reason: sessions.error.message,
    }
  }

  const open = sessions.value.find((session) => !session.closed)
  if (!open) {
    return { type: 'clock_in', label: LABELS.clock_in }
  }

  const hasOpenBreak = open.breaks.some((item) => item.endIso === null)
  if (hasOpenBreak) {
    return { type: 'break_end', label: LABELS.break_end }
  }

  const last = sorted.at(-1)
  if (last?.type === 'break_end') {
    return { type: 'clock_out', label: LABELS.clock_out }
  }

  // Após entrada (sem intervalo aberto) → iniciar intervalo.
  return { type: 'break_start', label: LABELS.break_start }
}

export function deriveJourneyStatus(entries: TimeEntry[]): JourneyStatus {
  const sessions = buildWorkSessions(sortEntries(entries))
  if (!sessions.ok) return 'invalid'

  if (sessions.value.length === 0) return 'idle'

  const open = sessions.value.find((session) => !session.closed)
  if (!open) {
    return sessions.value.every((session) => session.closed) ? 'done' : 'incomplete'
  }

  if (open.breaks.some((item) => item.endIso === null)) return 'on_break'
  return 'working'
}

/** Verifica se `type` é uma transição válida no estado atual. */
export function isPunchTransitionAllowed(
  entries: TimeEntry[],
  type: PunchType,
  occurredAt: string,
): { ok: true } | { ok: false; message: string } {
  const sorted = sortEntries(entries)

  const last = sorted.at(-1)
  if (last && Date.parse(occurredAt) < Date.parse(last.occurredAt)) {
    return {
      ok: false,
      message: 'O horário precisa ser posterior à última marcação do dia.',
    }
  }

  if (
    last &&
    last.type === type &&
    Math.abs(Date.parse(occurredAt) - Date.parse(last.occurredAt)) < 1000
  ) {
    return {
      ok: false,
      message: 'Marcação duplicada. Aguarde um instante ou escolha outro horário.',
    }
  }

  const probe: TimeEntry[] = [
    ...sorted,
    {
      id: '__probe__',
      userId: sorted[0]?.userId ?? 'probe',
      dateKey: sorted[0]?.dateKey ?? '1970-01-01',
      type,
      occurredAt,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    },
  ]

  const result = buildWorkSessions(probe)
  if (!result.ok) {
    return { ok: false, message: result.error.message }
  }
  return { ok: true }
}

export function firstClockInIso(entries: TimeEntry[]): string | null {
  const first = sortEntries(entries).find((entry) => entry.type === 'clock_in')
  return first?.occurredAt ?? null
}

export function punchStripFromEntries(entries: TimeEntry[]): Array<{
  type: PunchType
  label: string
  time: string | null
  occurredAt: string | null
}> {
  const slots: PunchType[] = ['clock_in', 'break_start', 'break_end', 'clock_out']
  const sessions = buildWorkSessions(sortEntries(entries))

  if (!sessions.ok || sessions.value.length === 0) {
    return slots.map((type) => ({
      type,
      label: SLOT_LABELS[type],
      time: null,
      occurredAt: null,
    }))
  }

  const session = sessions.value.find((item) => !item.closed) ?? sessions.value.at(-1)!

  const openBreak = session.breaks.find((item) => item.endIso === null)
  const closedBreak = [...session.breaks].reverse().find((item) => item.endIso)

  const byType: Record<PunchType, string | null> = {
    clock_in: session.clockInIso,
    break_start: openBreak?.startIso ?? closedBreak?.startIso ?? null,
    break_end: openBreak ? null : (closedBreak?.endIso ?? null),
    clock_out: session.clockOutIso,
  }

  return slots.map((type) => ({
    type,
    label: SLOT_LABELS[type],
    occurredAt: byType[type],
    time: byType[type] ? formatLocalTime(byType[type]!) : null,
  }))
}

function formatLocalTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
