/**
 * Date helpers. Dates are represented as "YYYY-MM-DD" strings. See
 * plan.md open question on timezones — this app assumes one shared
 * household timezone rather than per-user timezones, which is a
 * reasonable default for a household app.
 *
 * That "one shared timezone" is pinned explicitly here (APP_TIMEZONE)
 * rather than left to each runtime's local clock. This code runs in two
 * different places — the browser (whatever timezone the viewer's device
 * is set to) and the server (a Netlify Function, which defaults to UTC)
 * — and `new Date().getFullYear()/getMonth()/getDate()` silently uses
 * whichever local timezone the *current* runtime happens to be in. A
 * goal created in the evening in a negative-UTC-offset timezone lands on
 * the next calendar day in UTC, so the two runtimes disagreed about
 * whether "today" had already ended — a goal created "today" wouldn't
 * show up in "today's goals" once the server (UTC) considered its
 * createdAt to already be tomorrow. Formatting every instant against a
 * fixed IANA zone instead makes the result identical no matter which
 * runtime asks.
 */

export const APP_TIMEZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Formats an instant as "YYYY-MM-DD" in APP_TIMEZONE, regardless of the runtime's own local timezone. */
export function formatDate(date: Date): string {
  // en-CA locale formats as YYYY-MM-DD.
  return dateFormatter.format(date);
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
 * leading/trailing days from adjacent months. Pure calendar-date
 * arithmetic — no real instant is involved, so this deliberately stays in
 * UTC internally rather than using formatDate/APP_TIMEZONE: constructing
 * with Date.UTC and reading back with getUTC* is a self-consistent round
 * trip regardless of which timezone the runtime itself is in, with no
 * risk of a day rolling over from a local-vs-fixed-zone mismatch. */
export function monthGrid(year: number, month: number): string[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - startWeekday));

  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
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
