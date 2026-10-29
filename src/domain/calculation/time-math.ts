import { CalculationError } from './errors'

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Converte HH:mm em minutos desde 00:00. */
export function parseTimeToMinutes(value: string): number {
  const match = TIME_RE.exec(value)
  if (!match) {
    throw new CalculationError('INVALID_TIME', `Horário inválido: ${value}`)
  }
  return Number(match[1]) * 60 + Number(match[2])
}

export function assertDateKey(dateKey: string): void {
  if (!DATE_KEY_RE.test(dateKey)) {
    throw new CalculationError('INVALID_DATE', `dateKey inválido: ${dateKey}`)
  }
}

/** Dia da semana UTC estável a partir de yyyy-MM-dd (0=domingo). */
export function weekdayFromDateKey(dateKey: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  assertDateKey(dateKey)
  const [year, month, day] = dateKey.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
  return weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Duração de um período HH:mm→HH:mm em minutos inteiros.
 * Se end <= start, interpreta travessia de meia-noite.
 */
export function periodDurationMinutes(start: string, end: string): number {
  const startMin = parseTimeToMinutes(start)
  const endMin = parseTimeToMinutes(end)
  if (endMin > startMin) return endMin - startMin
  if (endMin < startMin) return 24 * 60 - startMin + endMin
  throw new CalculationError(
    'INVALID_PERIOD',
    `Período com duração zero: ${start}–${end}`,
  )
}

/** Diferença em minutos inteiros entre dois instantes ISO (floor). */
export function diffIsoMinutes(startIso: string, endIso: string): number {
  const startMs = Date.parse(startIso)
  const endMs = Date.parse(endIso)
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new CalculationError('INVALID_TIME', 'Instantâneo ISO inválido', {
      startIso,
      endIso,
    })
  }
  const diff = Math.floor((endMs - startMs) / 60_000)
  if (diff < 0) {
    throw new CalculationError('NEGATIVE_DURATION', 'Intervalo com duração negativa', {
      startIso,
      endIso,
    })
  }
  return diff
}

/** Verifica se dois intervalos [start, end) em minutos absolutos se sobrepõem. */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}
