import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isGoalActiveOnDate, isValidDateStr, todayStr } from "@/lib/dates";
import { buildCompletionMap, computeDayScore, goalPointsEarned } from "@/lib/scoring";
import { withErrorHandling } from "@/lib/apiRoute";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || viewer.id;
  const date = searchParams.get("date") || todayStr();

  if (!isValidDateStr(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const allGoals = await prisma.goal.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
  });
  const activeGoals = allGoals.filter((g) => isGoalActiveOnDate(g, date));

  const completions = await prisma.completion.findMany({
    where: { date, goalId: { in: activeGoals.map((g) => g.id) } },
  });
  const completionMap = buildCompletionMap(completions);
  const score = computeDayScore(activeGoals, completionMap);

  const goals = activeGoals.map((g) => ({
    id: g.id,
    title: g.title,
    points: g.points,
    count: g.count,
    recurrence: g.recurrence,
    category: g.category,
    completedSubIndexes: Array.from(completionMap.get(g.id) ?? []).sort((a, b) => a - b),
    pointsEarned: goalPointsEarned(g, completionMap.get(g.id)),
  }));

  return NextResponse.json({
    date,
    user: targetUser,
    isOwner: targetUser.id === viewer.id,
    isToday: date === todayStr(),
    goals,
    score,
  });
});
