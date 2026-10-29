import type { HistoryDayRow, MonthSummary } from './month-view'

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

/** Exporta o mês em CSV (UTF-8 com BOM para Excel). */
export function buildMonthCsv(input: {
  year: number
  month: number
  rows: HistoryDayRow[]
  summary: MonthSummary
}): string {
  const header = [
    'data',
    'semana',
    'entrada',
    'intervalo',
    'retorno',
    'saida',
    'trabalhado_min',
    'esperado_min',
    'saldo_min',
    'situacao',
    'completa',
  ]

  const lines = [
    header.join(','),
    ...input.rows
      .filter((row) => row.hasRecords)
      .map((row) =>
        [
          row.dateKey,
          row.weekdayLabel,
          row.clockIn,
          row.breakStart,
          row.breakEnd,
          row.clockOut,
          String(row.workedMinutes),
          String(row.expectedMinutes),
          String(row.balanceMinutes),
          row.situationLabel,
          row.isComplete ? 'sim' : 'nao',
        ]
          .map(csvEscape)
          .join(','),
      ),
    '',
    'resumo,valor',
    `trabalhado_min,${input.summary.workedMinutes}`,
    `esperado_min,${input.summary.expectedMinutes}`,
    `creditos_min,${input.summary.totals.creditsMinutes}`,
    `debitos_min,${input.summary.totals.debitsMinutes}`,
    `saldo_liquido_min,${input.summary.totals.netMinutes}`,
  ]

  return `\uFEFF${lines.join('\n')}`
}

export function monthCsvFilename(year: number, month: number): string {
  return `ponto-facil-${year}-${String(month).padStart(2, '0')}.csv`
}
