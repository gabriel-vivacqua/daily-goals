"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { apiFetch } from "@/lib/apiFetch";
import { gradeToColor, textColorFor } from "@/lib/grade";

type Person = {
  id: string;
  name: string;
  email: string;
  isSelf: boolean;
  goalCount: number;
  score: { pointsEarned: number; pointsPossible: number; grade: number | null };
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/users")
      .then((res) => res.json())
      .then((data) => setPeople(data.people))
      .catch(() => setError("Couldn't load people — try refreshing."));
  }, []);

  return (
    <div>
      <p className="micro-label mb-2">Household</p>
      <h1 className="headline mb-8 text-3xl sm:text-4xl">People ↘</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!people ? (
        <p className="micro-label">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <Link
              key={person.id}
              href={person.isSelf ? "/goals" : `/people/${person.id}`}
              className="group flex flex-col gap-4 rounded-card border border-line-dark bg-ink p-5 text-white transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <Avatar name={person.name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {person.name}
                    {person.isSelf && <span className="text-white/50"> (you)</span>}
                  </p>
                  <p className="micro-label !text-[10px] !text-white/50">
                    {person.goalCount} goal{person.goalCount === 1 ? "" : "s"} today
                  </p>
                </div>
              </div>

              <GradeBadge grade={person.score.grade} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function GradeBadge({ grade }: { grade: number | null }) {
  if (grade === null) {
    return (
      <div className="rounded-xl bg-white/10 px-3 py-2 text-center text-sm text-white/50">
        No goals logged
      </div>
    );
  }
  const bg = gradeToColor(grade);
  const light = textColorFor(grade) === "light";
  return (
    <div
      className={`rounded-xl px-3 py-2 text-center text-sm font-semibold ${
        light ? "text-white" : "text-foreground"
      }`}
      style={{ backgroundColor: bg }}
    >
      {grade.toFixed(0)}% today
    </div>
  );
}
