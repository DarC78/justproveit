export function isEarlyManualAppointment(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) && time < "10:00";
}

export function confirmEarlyManualBooking(date: string, time: string): boolean {
  if (!isEarlyManualAppointment(time)) return true;
  return window.confirm(`Programarea aleasă (${date}, ora ${time}, Europe/London) este înainte de ora obișnuită de începere, 10:00 UK. Doriți să programați totuși apelul?`);
}
