import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isGoalActiveOnDate, monthGrid, todayStr } from "@/lib/dates";
import { buildCompletionMap, computeDayScore } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || viewer.id;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-indexed

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const goals = await prisma.goal.findMany({ where: { userId, active: true } });
  const gridDates = monthGrid(year, month);
  const today = todayStr();
  const first = gridDates[0];
  const last = gridDates[gridDates.length - 1];

  const completions = await prisma.completion.findMany({
    where: {
      date: { gte: first, lte: last },
      goalId: { in: goals.map((g) => g.id) },
    },
  });
  const completionsByDate = new Map<string, typeof completions>();
  for (const c of completions) {
    if (!completionsByDate.has(c.date)) completionsByDate.set(c.date, []);
    completionsByDate.get(c.date)!.push(c);
  }

  const days = gridDates.map((date) => {
    if (date > today) {
      return { date, grade: null, pointsEarned: 0, pointsPossible: 0 };
    }
    const activeGoals = goals.filter((g) => isGoalActiveOnDate(g, date));
    const completionMap = buildCompletionMap(completionsByDate.get(date) ?? []);
    const score = computeDayScore(activeGoals, completionMap);
    return { date, ...score };
  });

  return NextResponse.json({ user: targetUser, year, month, days });
}
