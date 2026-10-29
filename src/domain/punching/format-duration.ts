/** Formata minutos inteiros como `7h 05m` / `45m` / `0m`. */
export function formatDurationMinutes(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '−' : ''
  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  if (hours === 0) return `${sign}${minutes}m`
  if (minutes === 0) return `${sign}${hours}h`
  return `${sign}${hours}h ${String(minutes).padStart(2, '0')}m`
}

/** Formata saldo com sinal explícito. */
export function formatBalanceMinutes(totalMinutes: number): string {
  if (totalMinutes === 0) return '0m'
  const sign = totalMinutes > 0 ? '+' : '−'
  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  if (hours === 0) return `${sign}${minutes}m`
  if (minutes === 0) return `${sign}${hours}h`
  return `${sign}${hours}h ${String(minutes).padStart(2, '0')}m`
}
