import { describe, expect, it } from 'vitest'

import { CalculationError } from './errors'
import {
  diffIsoMinutes,
  intervalsOverlap,
  parseTimeToMinutes,
  periodDurationMinutes,
  weekdayFromDateKey,
} from './time-math'

describe('parseTimeToMinutes', () => {
  it('converte HH:mm válidos', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('08:30')).toBe(8 * 60 + 30)
    expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59)
  })

  it('rejeita horários inválidos', () => {
    expect(() => parseTimeToMinutes('24:00')).toThrow(CalculationError)
    expect(() => parseTimeToMinutes('8:00')).toThrow(CalculationError)
    expect(() => parseTimeToMinutes('12:60')).toThrow(CalculationError)
  })
})

describe('periodDurationMinutes', () => {
  it('calcula períodos no mesmo dia', () => {
    expect(periodDurationMinutes('08:00', '12:00')).toBe(240)
  })

  it('calcula períodos que atravessam a meia-noite', () => {
    expect(periodDurationMinutes('22:00', '06:00')).toBe(8 * 60)
  })

  it('rejeita duração zero', () => {
    expect(() => periodDurationMinutes('10:00', '10:00')).toThrow(CalculationError)
  })
})

describe('diffIsoMinutes', () => {
  it('usa minutos inteiros (floor)', () => {
    expect(diffIsoMinutes('2026-10-28T08:00:00.000Z', '2026-10-28T08:00:59.999Z')).toBe(0)
    expect(diffIsoMinutes('2026-10-28T08:00:00.000Z', '2026-10-28T09:00:00.000Z')).toBe(
      60,
    )
  })

  it('suporta virada de dia', () => {
    expect(diffIsoMinutes('2026-10-28T22:00:00.000Z', '2026-10-29T06:00:00.000Z')).toBe(
      8 * 60,
    )
  })

  it('rejeita intervalo negativo', () => {
    expect(() =>
      diffIsoMinutes('2026-10-28T10:00:00.000Z', '2026-10-28T09:00:00.000Z'),
    ).toThrow(CalculationError)
  })
})

describe('weekdayFromDateKey', () => {
  it('retorna quarta-feira para 2026-10-28', () => {
    expect(weekdayFromDateKey('2026-10-28')).toBe(3)
  })
})

describe('intervalsOverlap', () => {
  it('detecta sobreposição semiaberta', () => {
    expect(intervalsOverlap(0, 60, 60, 120)).toBe(false)
    expect(intervalsOverlap(0, 61, 60, 120)).toBe(true)
  })
})
