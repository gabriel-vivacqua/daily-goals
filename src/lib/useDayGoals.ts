"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { buildCompletionMap, computeDayScore, goalPointsEarned } from "@/lib/scoring";
import type { DayGoal, DayResponse } from "@/lib/types";

/** Loads a user's goal instances + score for one date, with optimistic toggling. */
export function useDayGoals(date: string, userId?: string) {
  const [day, setDay] = useState<DayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams({ date });
    if (userId) params.set("userId", userId);
    const res = await apiFetch(`/api/day?${params}`).catch(() => null);
    if (!res || !res.ok) {
      setError("Couldn't load that day — try refreshing.");
      return;
    }
    setDay(await res.json());
  }, [date, userId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function toggle(goal: DayGoal, subIndex: number, completed: boolean) {
    if (!day) return;
    const previous = day;

    const nextGoals = day.goals.map((g) => {
      if (g.id !== goal.id) return g;
      const set = new Set(g.completedSubIndexes);
      if (completed) set.add(subIndex);
      else set.delete(subIndex);
      const completedSubIndexes = Array.from(set).sort((a, b) => a - b);
      return { ...g, completedSubIndexes, pointsEarned: goalPointsEarned(g, set) };
    });
    const completionMap = buildCompletionMap(
      nextGoals.flatMap((g) => g.completedSubIndexes.map((subIndex) => ({ goalId: g.id, subIndex })))
    );
    const score = computeDayScore(nextGoals, completionMap);
    setDay({ ...day, goals: nextGoals, score });

    const res = await apiFetch(`/api/goals/${goal.id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: day.date, subIndex, completed }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setDay(previous);
      setError("Couldn't save that check — please try again.");
    }
  }

  return { day, loading, error, reload: load, toggle };
}
