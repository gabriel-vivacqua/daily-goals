import { NextResponse } from "next/server";

/**
 * Wraps a route handler so an unexpected exception (DB unreachable, etc.)
 * returns a clean JSON 500 instead of an empty/opaque response the client
 * can't parse. Every handler still returns its own specific responses for
 * expected cases (401, 400, 404, ...) — this only catches what nothing
 * else does, and logs the real error server-side without leaking it to
 * the client.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "Something went wrong on our end. Please try again." },
        { status: 500 }
      );
    }
  };
}
