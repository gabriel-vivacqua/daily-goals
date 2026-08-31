import Link from "next/link";
import { isSameMonth, todayStr, WEEKDAY_LABELS } from "@/lib/dates";
import { gradeToColor, textColorFor } from "@/lib/grade";

export type CalendarDay = {
  date: string;
  grade: number | null;
};

export default function CalendarGrid({
  year,
  month,
  days,
  hrefForDate,
}: {
  year: number;
  month: number;
  days: CalendarDay[];
  hrefForDate: (date: string) => string;
}) {
  const today = todayStr();

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="micro-label !text-[10px] text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const inMonth = isSameMonth(day.date, year, month);
          const isToday = day.date === today;
          const dayNumber = Number(day.date.slice(-2));
          const hasData = day.grade !== null;
          const bg = hasData ? gradeToColor(day.grade as number, 0.85) : undefined;
          const textLight = hasData && textColorFor(day.grade as number) === "light";

          return (
            <Link
              key={day.date}
              href={hrefForDate(day.date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition-transform hover:scale-[1.05] hover:z-10 ${
                hasData ? "" : "border border-dashed border-line"
              } ${inMonth ? "" : "opacity-30"} ${
                isToday ? "ring-2 ring-offset-1 ring-foreground/70" : ""
              }`}
              style={bg ? { backgroundColor: bg } : undefined}
              title={hasData ? `${(day.grade as number).toFixed(1)}%` : "No data"}
            >
              <span className={textLight ? "text-white" : "text-foreground/70"}>{dayNumber}</span>
              {hasData && (
                <span
                  className={`text-[9px] font-medium ${textLight ? "text-white/80" : "text-foreground/70"}`}
                >
                  {(day.grade as number).toFixed(0)}%
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
