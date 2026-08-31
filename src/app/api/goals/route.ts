import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createGoalSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

/** Lists the current user's own goal templates (for management, not a specific date). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Bounds how fast one account can create rows — a household has a
  // handful of goals, not thousands; this is a spam/DB-bloat guard, not a
  // normal-usage limit.
  const { ok, retryAfterSeconds } = rateLimit(`create-goal:${user.id}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many goals created recently. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { title, points, count, recurrence, customDays, category } = parsed.data;

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title,
      points,
      count,
      recurrence,
      customDays: recurrence === "CUSTOM" ? JSON.stringify(customDays ?? []) : null,
      category: category || null,
    },
  });
  return NextResponse.json({ goal }, { status: 201 });
}
