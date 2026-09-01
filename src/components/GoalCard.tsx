"use client";

import { useState } from "react";
import type { DayGoal } from "@/lib/types";

const RECURRENCE_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKDAYS: "Weekdays",
  CUSTOM: "Custom days",
  ONCE: "One-time",
};

export default function GoalCard({
  goal,
  editable,
  onToggle,
  onEdit,
  onDelete,
}: {
  goal: DayGoal;
  editable: boolean;
  onToggle?: (subIndex: number, completed: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [pendingIndexes, setPendingIndexes] = useState<Set<number>>(new Set());
  const completedSet = new Set(goal.completedSubIndexes);
  const allDone = completedSet.size === goal.count;

  function handleToggle(subIndex: number) {
    if (!editable || !onToggle) return;
    setPendingIndexes((prev) => new Set(prev).add(subIndex));
    Promise.resolve(onToggle(subIndex, !completedSet.has(subIndex))).finally(() => {
      setPendingIndexes((prev) => {
        const next = new Set(prev);
        next.delete(subIndex);
        return next;
      });
    });
  }

  return (
    <div
      className={`group flex flex-col gap-4 rounded-card border border-line-dark bg-ink p-5 text-white transition-opacity ${
        allDone ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate headline text-lg leading-snug" title={goal.title}>
            {goal.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="micro-label !text-[10px] !text-white/50">
              {RECURRENCE_LABEL[goal.recurrence] ?? goal.recurrence}
            </span>
            {goal.category && (
              <span className="micro-label !text-[10px] !text-white/50">{goal.category}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {editable && (onEdit || onDelete) && (
            // Space is always reserved (opacity toggle, not hidden/flex) so revealing
            // these on hover never changes the title's line count or shifts anything below.
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label="Edit goal"
                  tabIndex={-1}
                  className="rounded-full bg-white/10 p-1.5 text-white/70 hover:text-white"
                >
                  <PencilIcon />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label="Delete goal"
                  tabIndex={-1}
                  className="rounded-full bg-white/10 p-1.5 text-white/70 hover:text-red-400"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          )}
          <span className="rounded-full border border-white/20 px-2.5 py-1 text-xs font-semibold text-white">
            {goal.points} pt{goal.points === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {goal.count === 1 ? (
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="check-node"
            checked={completedSet.has(0)}
            disabled={!editable || pendingIndexes.has(0)}
            onChange={() => handleToggle(0)}
          />
          <span className="text-sm text-white/80">
            {completedSet.has(0) ? "Done" : "Mark complete"}
          </span>
        </label>
      ) : (
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {Array.from({ length: goal.count }).map((_, i) => (
              <input
                key={i}
                type="checkbox"
                className="check-node"
                aria-label={`Sub-check ${i + 1} of ${goal.count}`}
                checked={completedSet.has(i)}
                disabled={!editable || pendingIndexes.has(i)}
                onChange={() => handleToggle(i)}
              />
            ))}
          </div>
          <span className="text-xs text-white/50">
            {completedSet.size} / {goal.count} complete · {goal.pointsEarned.toFixed(1)} pts
          </span>
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" strokeLinecap="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}
