import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiRoute";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
});
