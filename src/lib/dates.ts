/**
 * Date helpers. Dates are represented as "YYYY-MM-DD" strings and always
 * parsed/constructed against local calendar time (not UTC) so that a
 * weekday or "today" check can't shift by a day near midnight in
 * negative-UTC-offset timezones. See plan.md open question on timezones —
 * this app assumes one shared local timezone (the server's) rather than
 * per-user timezones, which is a reasonable default for a household app.
 */

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function isValidDateStr(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !Number.isNaN(parseDate(dateStr).getTime());
}

/** 0 = Sunday .. 6 = Saturday */
export function weekdayOf(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export type Recurrence = "DAILY" | "WEEKDAYS" | "CUSTOM";

export function isGoalActiveOnDate(
  goal: { recurrence: string; customDays: string | null; createdAt: Date },
  dateStr: string
): boolean {
  const created = formatDate(goal.createdAt);
  if (dateStr < created) return false;

  const weekday = weekdayOf(dateStr);
  switch (goal.recurrence) {
    case "WEEKDAYS":
      return weekday >= 1 && weekday <= 5;
    case "CUSTOM": {
      if (!goal.customDays) return false;
      try {
        const days: number[] = JSON.parse(goal.customDays);
        return days.includes(weekday);
      } catch {
        return false;
      }
    }
    case "DAILY":
    default:
      return true;
  }
}

/** Returns the "YYYY-MM-DD" strings for a full 6-week (42-day) calendar grid
 * covering `year`/`month` (1-indexed month), starting on Sunday, including
 * leading/trailing days from adjacent months. */
export function monthGrid(year: number, month: number): string[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month - 1, 1 - startWeekday);

  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(formatDate(d));
  }
  return days;
}

export function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseDate(dateStr);
  return d.getFullYear() === year && d.getMonth() === month - 1;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
