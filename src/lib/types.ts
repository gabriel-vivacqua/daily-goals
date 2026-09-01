export type Recurrence = "DAILY" | "WEEKDAYS" | "CUSTOM" | "ONCE";

/** A goal's daily instance, as returned by GET /api/day */
export type DayGoal = {
  id: string;
  title: string;
  points: number;
  count: number;
  recurrence: Recurrence;
  category: string | null;
  completedSubIndexes: number[];
  pointsEarned: number;
};

/** A goal template, as returned by GET /api/goals */
export type GoalTemplate = {
  id: string;
  userId: string;
  title: string;
  points: number;
  count: number;
  recurrence: Recurrence;
  customDays: string | null;
  onceDate: string | null;
  category: string | null;
  active: boolean;
  createdAt: string;
};

export type DayScore = {
  pointsEarned: number;
  pointsPossible: number;
  grade: number | null;
};

export type DayResponse = {
  date: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  isOwner: boolean;
  isToday: boolean;
  goals: DayGoal[];
  score: DayScore;
};
