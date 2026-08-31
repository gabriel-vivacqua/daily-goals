"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import GoalCard from "@/components/GoalCard";
import MonthCalendar from "@/components/MonthCalendar";
import ProgressBar from "@/components/ProgressBar";
import { todayStr } from "@/lib/dates";
import { useDayGoals } from "@/lib/useDayGoals";

export default function PersonPage() {
  const { userId } = useParams<{ userId: string }>();
  const today = todayStr();
  const { day, loading, error, toggle } = useDayGoals(today, userId);
  const editable = Boolean(day?.isOwner && day?.isToday);

  return (
    <div>
      <Link href="/people" className="micro-label mb-6 inline-block hover:text-foreground">
        ← All people
      </Link>

      <p className="micro-label mb-2">Today</p>
      <h1 className="headline mb-8 text-3xl sm:text-4xl">
        {day ? `${day.user.name}${day.isOwner ? " (you)" : ""}` : "…"} ↘
      </h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="micro-label">Loading…</p>
      ) : !day ? null : (
        <>
          <div className="mb-8 rounded-card border border-line p-5">
            <ProgressBar
              pointsEarned={day.score.pointsEarned}
              pointsPossible={day.score.pointsPossible}
            />
          </div>

          {!editable && (
            <p className="micro-label mb-4 !normal-case !tracking-normal text-foreground/50">
              Read-only view — only {day.user.name.split(" ")[0]} can check these off.
            </p>
          )}

          {day.goals.length === 0 ? (
            <div className="mb-10 rounded-card border border-dashed border-line px-6 py-12 text-center">
              <p className="text-sm text-foreground/60">Nothing scheduled for today.</p>
            </div>
          ) : (
            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {day.goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  editable={editable}
                  onToggle={
                    editable ? (subIndex, completed) => toggle(goal, subIndex, completed) : undefined
                  }
                />
              ))}
            </div>
          )}

          <div className="rounded-card border border-line p-5 sm:p-6">
            <MonthCalendar userId={userId} hrefForDate={(date) => `/calendar/${date}?user=${userId}`} />
          </div>
        </>
      )}
    </div>
  );
}
