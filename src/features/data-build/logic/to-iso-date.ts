const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function toIsoDate(text: string | null, year: number): string | null {
  // "10 March" or "March 10"
  const dayFirst = text?.match(/(\d{1,2})\s+([A-Za-z]+)/);
  const monthFirst = text?.match(/([A-Za-z]+)\s+(\d{1,2})/);
  const day = dayFirst?.[1] ?? monthFirst?.[2];
  const monthName = dayFirst?.[2] ?? monthFirst?.[1];
  if (!day || !monthName) return null;
  const month = MONTHS.findIndex((name) => name.toLowerCase() === monthName.toLowerCase());
  if (month === -1) return null;
  return `${year}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}
