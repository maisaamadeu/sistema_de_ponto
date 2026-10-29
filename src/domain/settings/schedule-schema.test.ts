import { describe, expect, it } from 'vitest'

import { computeExpectedMinutesFromTimes } from '@/domain/calculation'

import {
  defaultWorkScheduleFormValues,
  syncAutoExpected,
  workScheduleFormSchema,
} from './schedule-schema'

describe('workScheduleFormSchema', () => {
  it('aceita jornada rápida de segunda a sexta', () => {
    const values = defaultWorkScheduleFormValues()
    const parsed = workScheduleFormSchema.safeParse(values)
    expect(parsed.success).toBe(true)
  })

  it('rejeita quando nenhum dia está ativo', () => {
    const values = defaultWorkScheduleFormValues({
      weekdays: defaultWorkScheduleFormValues().weekdays.map((day) => ({
        ...day,
        enabled: false,
      })),
    })
    const parsed = workScheduleFormSchema.safeParse(values)
    expect(parsed.success).toBe(false)
  })

  it('rejeita intervalo invertido com mensagem clara', () => {
    const values = defaultWorkScheduleFormValues({
      uniform: {
        clockIn: '08:00',
        breakStart: '07:00',
        breakEnd: '13:00',
        clockOut: '17:00',
        expectedDailyMinutes: 480,
        expectedManual: true,
      },
    })
    const parsed = workScheduleFormSchema.safeParse(values)
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message)
      expect(messages.some((msg) => msg.includes('intervalo'))).toBe(true)
    }
  })

  it('calcula carga automática e syncAutoExpected atualiza minutos', () => {
    const auto = computeExpectedMinutesFromTimes({
      clockIn: '09:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      clockOut: '18:00',
    })
    expect(auto).toBe(480)

    const synced = syncAutoExpected({
      clockIn: '09:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      clockOut: '18:00',
      expectedDailyMinutes: 0,
      expectedManual: false,
    })
    expect(synced.expectedDailyMinutes).toBe(480)
  })

  it('permite ajuste manual diferente do automático', () => {
    const values = defaultWorkScheduleFormValues({
      uniform: {
        clockIn: '08:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        clockOut: '17:00',
        expectedDailyMinutes: 450,
        expectedManual: true,
      },
    })
    expect(workScheduleFormSchema.safeParse(values).success).toBe(true)
  })
})
