"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import GoalCard from "@/components/GoalCard";
import ProgressBar from "@/components/ProgressBar";
import { isValidDateStr, parseDate } from "@/lib/dates";
import { useDayGoals } from "@/lib/useDayGoals";

export default function DayBreakdownPage() {
  const params = useParams<{ date: string }>();
  const searchParams = useSearchParams();
  const date = params.date;
  const userId = searchParams.get("user") ?? undefined;

  const { day, loading, error, toggle } = useDayGoals(date, userId);

  if (!isValidDateStr(date)) {
    return <p className="text-sm text-red-600">Invalid date.</p>;
  }

  const backHref = userId ? `/people/${userId}` : "/calendar";
  const editable = Boolean(day?.isOwner && day?.isToday);

  return (
    <div>
      <Link href={backHref} className="micro-label mb-6 inline-block hover:text-foreground">
        ← Back
      </Link>

      <p className="micro-label mb-2">
        {day ? `${day.user.name}${day.isOwner ? " (you)" : ""}` : " "}
      </p>
      <h1 className="headline mb-8 text-3xl sm:text-4xl">
        {parseDate(date).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </h1>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="micro-label">Loading…</p>
      ) : !day || day.goals.length === 0 ? (
        <div className="rounded-card border border-dashed border-line px-6 py-16 text-center">
          <p className="headline mb-2 text-xl">No goals that day.</p>
          <p className="text-sm text-foreground/60">
            Nothing was scheduled, or no goals existed yet.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-card border border-line p-5">
            <ProgressBar
              pointsEarned={day.score.pointsEarned}
              pointsPossible={day.score.pointsPossible}
            />
          </div>

          {!editable && (
            <p className="micro-label mb-4 !normal-case !tracking-normal text-foreground/50">
              {day.isOwner ? "Past days are locked — only today can be checked off." : "Read-only view."}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {day.goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                editable={editable}
                onToggle={editable ? (subIndex, completed) => toggle(goal, subIndex, completed) : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
