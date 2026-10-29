/** Data local yyyy-MM-dd. */
export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** HH:mm local a partir de Date. */
export function localTimeHHmm(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Combina dateKey (yyyy-MM-dd) + HH:mm no fuso local → ISO.
 */
export function combineLocalDateAndTime(dateKey: string, timeHHmm: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeHHmm)
  if (!match || !time) {
    throw new Error('Data ou horário inválido.')
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(time[1])
  const minutes = Number(time[2])
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data ou horário inválido.')
  }
  return date.toISOString()
}

export function formatLongDatePt(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
