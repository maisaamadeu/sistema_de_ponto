import type { TimeEntry } from '@/domain/entities'

import { CalculationError, err, ok, type CalculationResult } from './errors'
import { diffIsoMinutes, intervalsOverlap } from './time-math'

export interface BreakInterval {
  startIso: string
  endIso: string | null
}

export interface WorkSession {
  clockInIso: string
  clockOutIso: string | null
  breaks: BreakInterval[]
  /** Minutos efetivamente trabalhados (inteiros). */
  workedMinutes: number
  closed: boolean
}

interface MutableSession {
  clockInIso: string
  clockOutIso: string | null
  breaks: BreakInterval[]
  openBreakStart: string | null
}

/**
 * Soma segmentos trabalhados:
 * clock_in → break_start, break_end → break_start, break_end → clock_out|asOf.
 * Intervalo aberto interrompe a contagem no início do intervalo.
 */
export function computeWorkedMinutes(
  session: Omit<MutableSession, 'openBreakStart'> & { openBreakStart: string | null },
  asOfIso?: string,
): CalculationResult<number> {
  const closedBreaks = session.breaks.filter(
    (item): item is { startIso: string; endIso: string } => item.endIso !== null,
  )

  let cursor = session.clockInIso
  let total = 0

  for (const brk of closedBreaks) {
    try {
      total += diffIsoMinutes(cursor, brk.startIso)
    } catch (error) {
      return err(error as CalculationError)
    }
    cursor = brk.endIso
  }

  if (session.openBreakStart) {
    try {
      total += diffIsoMinutes(cursor, session.openBreakStart)
    } catch (error) {
      return err(error as CalculationError)
    }
    return ok(total)
  }

  if (session.clockOutIso) {
    try {
      total += diffIsoMinutes(cursor, session.clockOutIso)
    } catch (error) {
      return err(error as CalculationError)
    }
    return ok(total)
  }

  if (asOfIso) {
    try {
      total += diffIsoMinutes(cursor, asOfIso)
    } catch (error) {
      return err(error as CalculationError)
    }
    return ok(total)
  }

  // Sessão aberta sem asOf: conta apenas segmentos já fechados.
  return ok(total)
}

/**
 * Constrói sessões a partir das marcações de um mesmo dia lógico.
 */
export function buildWorkSessions(
  entries: TimeEntry[],
  asOfIso?: string,
): CalculationResult<WorkSession[]> {
  const sorted = [...entries].sort((a, b) => {
    const byTime = Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
    if (byTime !== 0) return byTime
    return a.id.localeCompare(b.id)
  })

  const sessions: WorkSession[] = []
  let current: MutableSession | null = null

  const finalize = (
    session: MutableSession,
    closed: boolean,
  ): CalculationResult<void> => {
    const worked = computeWorkedMinutes(session, asOfIso)
    if (!worked.ok) return worked
    sessions.push({
      clockInIso: session.clockInIso,
      clockOutIso: session.clockOutIso,
      breaks: [...session.breaks],
      workedMinutes: worked.value,
      closed,
    })
    return ok(undefined)
  }

  for (const entry of sorted) {
    switch (entry.type) {
      case 'clock_in': {
        if (current) {
          return err(
            new CalculationError(
              'INVALID_PUNCH_SEQUENCE',
              'Entrada sem fechar a sessão anterior',
              { entryId: entry.id },
            ),
          )
        }
        current = {
          clockInIso: entry.occurredAt,
          clockOutIso: null,
          breaks: [],
          openBreakStart: null,
        }
        break
      }
      case 'break_start': {
        if (!current || current.clockOutIso || current.openBreakStart) {
          return err(
            new CalculationError(
              'INVALID_PUNCH_SEQUENCE',
              'Início de intervalo sem sessão ativa',
              { entryId: entry.id },
            ),
          )
        }
        current.openBreakStart = entry.occurredAt
        break
      }
      case 'break_end': {
        if (!current || !current.openBreakStart || current.clockOutIso) {
          return err(
            new CalculationError(
              'INVALID_PUNCH_SEQUENCE',
              'Fim de intervalo sem intervalo aberto',
              { entryId: entry.id },
            ),
          )
        }
        current.breaks.push({
          startIso: current.openBreakStart,
          endIso: entry.occurredAt,
        })
        current.openBreakStart = null
        break
      }
      case 'clock_out': {
        if (!current || current.clockOutIso || current.openBreakStart) {
          return err(
            new CalculationError(
              'INVALID_PUNCH_SEQUENCE',
              'Saída inválida (sem entrada ou com intervalo aberto)',
              { entryId: entry.id },
            ),
          )
        }
        current.clockOutIso = entry.occurredAt
        const closed = finalize(current, true)
        if (!closed.ok) return closed
        current = null
        break
      }
      default: {
        return err(
          new CalculationError('INVALID_PUNCH_SEQUENCE', 'Tipo de marcação desconhecido'),
        )
      }
    }
  }

  if (current) {
    if (current.openBreakStart) {
      current.breaks.push({ startIso: current.openBreakStart, endIso: null })
      // openBreakStart permanece para o cálculo
    }
    const open = finalize(current, false)
    if (!open.ok) return open
  }

  const overlapCheck = assertSessionsDoNotOverlap(sessions)
  if (!overlapCheck.ok) return overlapCheck

  return ok(sessions)
}

function sessionExclusiveEndMs(session: WorkSession): number {
  if (session.clockOutIso) return Date.parse(session.clockOutIso)
  const openBreak = session.breaks.find((item) => item.endIso === null)
  if (openBreak) return Date.parse(openBreak.startIso)
  // Sessão ainda em trabalho sem saída: usa o próprio clockIn como ponta mínima
  // e deixa o overlap só detectar contenção real via clockIn de outra sessão.
  return Date.parse(session.clockInIso) + 1
}

export function assertSessionsDoNotOverlap(
  sessions: WorkSession[],
): CalculationResult<true> {
  for (let i = 0; i < sessions.length; i += 1) {
    for (let j = i + 1; j < sessions.length; j += 1) {
      const aStart = Date.parse(sessions[i].clockInIso)
      const bStart = Date.parse(sessions[j].clockInIso)
      const aEnd = sessionExclusiveEndMs(sessions[i])
      const bEnd = sessionExclusiveEndMs(sessions[j])
      if ([aStart, bStart, aEnd, bEnd].some(Number.isNaN)) {
        return err(new CalculationError('INVALID_TIME', 'Sessão com instante inválido'))
      }
      if (intervalsOverlap(aStart, aEnd, bStart, bEnd)) {
        return err(
          new CalculationError(
            'OVERLAPPING_SESSIONS',
            'Sessões de trabalho se sobrepõem',
          ),
        )
      }
    }
  }
  return ok(true)
}

export function sumWorkedMinutes(sessions: WorkSession[]): number {
  return sessions.reduce((total, session) => total + session.workedMinutes, 0)
}
