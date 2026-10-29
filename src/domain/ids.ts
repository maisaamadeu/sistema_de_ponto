/**
 * Identificadores estáveis (UUID v4) adequados a futura sincronização com Firestore.
 */
export function createStableId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback determinístico o bastante para ambientes sem crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

/** Chave estável e determinística para um WorkDay materializado. */
export function createWorkDayId(userId: string, dateKey: string): string {
  return `wd_${userId}_${dateKey}`
}

export const GUEST_USER_ID_KEY = 'ponto-facil.guestUserId'
