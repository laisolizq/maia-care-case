// La demo usa un único calendario; en una versión multiusuaria dependería de su zona horaria.
export function getTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
}
