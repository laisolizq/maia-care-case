// Mismo calendario que el backend para que "hoy" no cambie entre navegador y servidor.
export function getTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
}
