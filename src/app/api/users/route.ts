import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isGoalActiveOnDate, todayStr } from "@/lib/dates";
import { buildCompletionMap, computeDayScore } from "@/lib/scoring";
import { withErrorHandling } from "@/lib/apiRoute";

export const GET = withErrorHandling(async () => {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayStr();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const goals = await prisma.goal.findMany({ where: { active: true } });
  const goalsByUser = new Map<string, typeof goals>();
  for (const g of goals) {
    if (!goalsByUser.has(g.userId)) goalsByUser.set(g.userId, []);
    goalsByUser.get(g.userId)!.push(g);
  }

  const completions = await prisma.completion.findMany({
    where: { date: today, goalId: { in: goals.map((g) => g.id) } },
  });
  const completionMap = buildCompletionMap(completions);

  const people = users.map((u) => {
    const userGoals = goalsByUser.get(u.id) ?? [];
    const activeToday = userGoals.filter((g) => isGoalActiveOnDate(g, today));
    const score = computeDayScore(activeToday, completionMap);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isSelf: u.id === viewer.id,
      goalCount: activeToday.length,
      score,
    };
  });

  return NextResponse.json({ today, people });
});
