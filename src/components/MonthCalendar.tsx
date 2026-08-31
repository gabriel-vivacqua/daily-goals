"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarGrid from "@/components/CalendarGrid";
import GradeLegend from "@/components/GradeLegend";
import { apiFetch } from "@/lib/apiFetch";
import { monthGrid, MONTH_NAMES, todayStr } from "@/lib/dates";

type ScoresResponse = {
  user: { id: string; name: string };
  year: number;
  month: number;
  days: { date: string; grade: number | null }[];
};

export default function MonthCalendar({
  userId,
  hrefForDate,
}: {
  userId?: string;
  hrefForDate: (date: string) => string;
}) {
  const today = todayStr();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [data, setData] = useState<ScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const placeholderDays = useMemo(
    () => monthGrid(year, month).map((date) => ({ date, grade: null as number | null })),
    [year, month]
  );

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (userId) params.set("userId", userId);
    apiFetch(`/api/scores?${params}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year, month, userId]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="headline text-xl">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-foreground/40"
          >
            ←
          </button>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-foreground/40"
          >
            →
          </button>
        </div>
      </div>

      <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <CalendarGrid
          year={year}
          month={month}
          days={data?.days ?? placeholderDays}
          hrefForDate={hrefForDate}
        />
      </div>

      <div className="mt-5">
        <GradeLegend />
      </div>
    </div>
  );
}
