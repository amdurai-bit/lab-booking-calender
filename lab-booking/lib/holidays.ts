// ─────────────────────────────────────────────────────────────────────────────
// UK Bank Holidays (England & Wales) + University of Warwick closure blocks
// Covers 2024 – 2027. Extend the arrays below for future years.
// Sources:
//   • https://www.gov.uk/bank-holidays
//   • https://warwick.ac.uk/services/humanresources/internal/holystat/
// ─────────────────────────────────────────────────────────────────────────────

export type BlockReason = 'bank-holiday' | 'university-closure' | 'weekend';

export interface DayBlock {
  reason: BlockReason;
  label: string;
}

// ── Bank holidays: date string → display label ────────────────────────────────

const BANK_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-01-01': "New Year's Day",
  '2024-03-29': 'Good Friday',
  '2024-04-01': 'Easter Monday',
  '2024-05-06': 'Early May Bank Holiday',
  '2024-05-27': 'Spring Bank Holiday',
  '2024-08-26': 'Summer Bank Holiday',
  '2024-12-25': 'Christmas Day',
  '2024-12-26': 'Boxing Day',

  // 2025
  '2025-01-01': "New Year's Day",
  '2025-04-18': 'Good Friday',
  '2025-04-21': 'Easter Monday',
  '2025-05-05': 'Early May Bank Holiday',
  '2025-05-26': 'Spring Bank Holiday',
  '2025-08-25': 'Summer Bank Holiday',
  '2025-12-25': 'Christmas Day',
  '2025-12-26': 'Boxing Day',

  // 2026
  '2026-01-01': "New Year's Day",
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Easter Monday',
  '2026-05-04': 'Early May Bank Holiday',
  '2026-05-25': 'Spring Bank Holiday',
  '2026-08-31': 'Summer Bank Holiday',
  '2026-12-25': 'Christmas Day',
  '2026-12-28': 'Boxing Day (substitute)',

  // 2027
  '2027-01-01': "New Year's Day",
  '2027-03-26': 'Good Friday',
  '2027-03-29': 'Easter Monday',
  '2027-05-03': 'Early May Bank Holiday',
  '2027-05-31': 'Spring Bank Holiday',
  '2027-08-30': 'Summer Bank Holiday',
  '2027-12-27': 'Christmas Day (substitute)',
  '2027-12-28': 'Boxing Day (substitute)',
};

// ── Warwick University statutory closure periods ──────────────────────────────
// Each entry is an inclusive [start, end] range (YYYY-MM-DD strings).

const WARWICK_CLOSURES: Array<{ start: string; end: string; label: string }> = [
  // Christmas / New Year closures
  { start: '2024-12-23', end: '2025-01-03', label: 'Warwick Christmas Closure' },
  { start: '2025-12-22', end: '2026-01-02', label: 'Warwick Christmas Closure' },
  { start: '2026-12-23', end: '2027-01-04', label: 'Warwick Christmas Closure' },

  // Easter closures (Good Friday week – typically 4 days around the holiday)
  { start: '2025-04-17', end: '2025-04-22', label: 'Warwick Easter Closure' },
  { start: '2026-04-02', end: '2026-04-07', label: 'Warwick Easter Closure' },
  { start: '2027-03-25', end: '2027-03-30', label: 'Warwick Easter Closure' },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns block info for the given date, or null if the date is a normal working day.
 * dateStr must be in YYYY-MM-DD format (local date, no timezone conversion applied).
 */
export function getDayBlock(dateStr: string): DayBlock | null {
  // Use noon to sidestep any DST/timezone edge on Date parsing
  const date = new Date(`${dateStr}T12:00:00`);
  const dow = date.getDay(); // 0=Sun 6=Sat

  if (dow === 0 || dow === 6) {
    return { reason: 'weekend', label: 'Weekend' };
  }

  if (BANK_HOLIDAYS[dateStr]) {
    return { reason: 'bank-holiday', label: BANK_HOLIDAYS[dateStr] };
  }

  for (const c of WARWICK_CLOSURES) {
    if (dateStr >= c.start && dateStr <= c.end) {
      return { reason: 'university-closure', label: c.label };
    }
  }

  return null;
}

/** Convenience: true if the date is a weekend, bank holiday, or closure. */
export function isBlockedDay(dateStr: string): boolean {
  return getDayBlock(dateStr) !== null;
}
