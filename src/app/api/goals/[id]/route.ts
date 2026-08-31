import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateGoalSchema } from "@/lib/validation";
import { withErrorHandling } from "@/lib/apiRoute";

async function loadOwnedGoal(userId: string, id: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) return null;
  return goal;
}

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedGoal(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const recurrence = data.recurrence ?? existing.recurrence;

  const goal = await prisma.goal.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.points !== undefined && { points: data.points }),
      ...(data.category !== undefined && { category: data.category || null }),
      ...(data.active !== undefined && { active: data.active }),
      count: data.count ?? existing.count,
      recurrence,
      customDays:
        recurrence === "CUSTOM"
          ? JSON.stringify(data.customDays ?? existing.customDays ?? [])
          : null,
    },
  });
  return NextResponse.json({ goal });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedGoal(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.goal.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
});
