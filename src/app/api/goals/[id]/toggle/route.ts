import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toggleSchema } from "@/lib/validation";
import { isGoalActiveOnDate, todayStr } from "@/lib/dates";
import { withErrorHandling } from "@/lib/apiRoute";

export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { date, subIndex, completed } = parsed.data;

  // Only today can be checked/unchecked — past days are a locked historical record.
  if (date !== todayStr()) {
    return NextResponse.json(
      { error: "Only today's goals can be checked" },
      { status: 403 }
    );
  }
  if (!isGoalActiveOnDate(goal, date)) {
    return NextResponse.json(
      { error: "This goal is not scheduled for today" },
      { status: 403 }
    );
  }
  if (subIndex >= goal.count) {
    return NextResponse.json({ error: "Invalid sub-check index" }, { status: 400 });
  }

  if (completed) {
    await prisma.completion.upsert({
      where: { goalId_date_subIndex: { goalId: goal.id, date, subIndex } },
      create: { goalId: goal.id, date, subIndex },
      update: {},
    });
  } else {
    await prisma.completion
      .delete({
        where: { goalId_date_subIndex: { goalId: goal.id, date, subIndex } },
      })
      .catch(() => null);
  }

  return NextResponse.json({ ok: true });
});
