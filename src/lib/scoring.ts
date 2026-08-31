/**
 * Scoring — see plan.md §5. Computed on the fly from a goal's `count` and
 * `points` plus how many of its sub-checks are completed for a given date,
 * rather than cached, since a household's daily data volume is tiny.
 */

export type ScorableGoal = {
  id: string;
  points: number;
  count: number;
};

export type CompletionMap = Map<string, Set<number>>; // goalId -> completed subIndexes

export function buildCompletionMap(
  completions: { goalId: string; subIndex: number }[]
): CompletionMap {
  const map: CompletionMap = new Map();
  for (const c of completions) {
    if (!map.has(c.goalId)) map.set(c.goalId, new Set());
    map.get(c.goalId)!.add(c.subIndex);
  }
  return map;
}

export function goalPointsEarned(goal: ScorableGoal, completed: Set<number> | undefined): number {
  const completedCount = completed ? completed.size : 0;
  if (goal.count <= 0) return 0;
  return goal.points * (completedCount / goal.count);
}

export type DayScore = {
  pointsEarned: number;
  pointsPossible: number;
  grade: number | null; // null when there were no active goals that day
};

export function computeDayScore(
  activeGoals: ScorableGoal[],
  completionMap: CompletionMap
): DayScore {
  const pointsPossible = activeGoals.reduce((sum, g) => sum + g.points, 0);
  const pointsEarned = activeGoals.reduce(
    (sum, g) => sum + goalPointsEarned(g, completionMap.get(g.id)),
    0
  );
  const grade = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : null;
  return { pointsEarned, pointsPossible, grade };
}
