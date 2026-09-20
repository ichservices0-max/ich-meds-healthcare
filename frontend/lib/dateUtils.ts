/**
 * Utility functions for date normalization and comparison across doctor dashboard, calendar, and live queue.
 */

export function isSameCalendarDay(
  dateInput: string | Date | null | undefined,
  targetYear: number,
  targetMonth: number, // 0-indexed (0 = Jan, 8 = Sep)
  targetDay: number   // 1-indexed (1..31)
): boolean {
  if (!dateInput) return false;

  // 1. Raw string check YYYY-MM-DD (fast and timezone-independent)
  if (typeof dateInput === 'string') {
    const rawDatePart = dateInput.split('T')[0];
    const parts = rawDatePart.split('-');
    if (parts.length === 3) {
      const pYear = parseInt(parts[0], 10);
      const pMonth = parseInt(parts[1], 10) - 1;
      const pDay = parseInt(parts[2], 10);
      if (pYear === targetYear && pMonth === targetMonth && pDay === targetDay) {
        return true;
      }
    }
  }

  // 2. Date object parsing (check local and UTC date representation)
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    // Local match
    if (d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === targetDay) {
      return true;
    }
    // UTC match (for ISO strings stored at 00:00:00.000Z)
    if (d.getUTCFullYear() === targetYear && d.getUTCMonth() === targetMonth && d.getUTCDate() === targetDay) {
      return true;
    }
  }

  return false;
}

export function isTodayCalendarDay(dateInput: string | Date | null | undefined): boolean {
  const now = new Date();
  return isSameCalendarDay(dateInput, now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDateToYYYYMMDD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
