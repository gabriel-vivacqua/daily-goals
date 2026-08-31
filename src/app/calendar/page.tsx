"use client";

import MonthCalendar from "@/components/MonthCalendar";

export default function CalendarPage() {
  return (
    <div>
      <p className="micro-label mb-2">Your history</p>
      <h1 className="headline mb-8 text-3xl sm:text-4xl">Calendar ↘</h1>

      <div className="rounded-card border border-line p-5 sm:p-6">
        <MonthCalendar hrefForDate={(date) => `/calendar/${date}`} />
      </div>
    </div>
  );
}
