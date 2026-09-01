"use client";

import { useState, FormEvent } from "react";
import type { GoalTemplate, Recurrence } from "@/lib/types";
import { CATEGORY_EMOJI_CHOICES, splitCategoryEmoji } from "@/lib/categoryEmoji";

export type GoalFormValues = {
  title: string;
  points: number;
  count: number;
  recurrence: Recurrence;
  customDays: number[];
  category: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toFormValues(goal?: GoalTemplate | null): GoalFormValues {
  if (!goal) {
    return {
      title: "",
      points: 10,
      count: 1,
      recurrence: "DAILY",
      customDays: [],
      category: "",
    };
  }
  return {
    title: goal.title,
    points: goal.points,
    count: goal.count,
    recurrence: goal.recurrence,
    customDays: goal.customDays ? JSON.parse(goal.customDays) : [],
    category: goal.category ?? "",
  };
}

export default function GoalFormModal({
  goal,
  onClose,
  onSubmit,
}: {
  goal?: GoalTemplate | null;
  onClose: () => void;
  onSubmit: (values: GoalFormValues) => Promise<string | void>;
}) {
  const [values, setValues] = useState<GoalFormValues>(() => toFormValues(goal));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  function update<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function selectEmoji(emoji: string) {
    const { text } = splitCategoryEmoji(values.category);
    update("category", text ? `${emoji} ${text}` : emoji);
    setShowEmojiPicker(false);
  }

  function toggleCustomDay(day: number) {
    setValues((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter((d) => d !== day)
        : [...prev.customDays, day].sort(),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const errorMessage = await onSubmit(values);
      if (errorMessage) {
        setError(errorMessage);
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card border border-line bg-background p-6 shadow-xl">
        <h2 className="headline mb-5 text-xl">{goal ? "Edit goal" : "New goal"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="micro-label mb-1.5 block">Title</label>
            <input
              type="text"
              required
              maxLength={120}
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              className={INPUT_CLASS}
              placeholder="Solve LeetCode problems"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="micro-label mb-1.5 block">Points</label>
              <input
                type="number"
                required
                min={0.1}
                step="any"
                value={values.points}
                onChange={(e) => update("points", Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="micro-label mb-1.5 block">Count</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={values.count}
                onChange={(e) => update("count", Number(e.target.value))}
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-xs text-foreground/40">
                {values.count <= 1 ? "One checkbox" : `${values.count} checkboxes`}
              </p>
            </div>
          </div>

          <div className="relative">
            <label className="micro-label mb-1.5 block">Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={60}
                value={values.category}
                onChange={(e) => update("category", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Optional"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                aria-label="Pick an emoji for this category"
                className="shrink-0 rounded-xl border border-line px-3 text-lg hover:border-foreground/30"
              >
                {splitCategoryEmoji(values.category).emoji ?? "🙂"}
              </button>
            </div>

            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 grid w-56 grid-cols-6 gap-1 rounded-xl border border-line bg-background p-2 shadow-xl">
                  {CATEGORY_EMOJI_CHOICES.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => selectEmoji(emoji)}
                      className="rounded-lg p-1.5 text-lg hover:bg-foreground/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="micro-label mb-1.5 block">Recurrence</label>
            <div className="flex gap-2">
              {(["DAILY", "WEEKDAYS", "CUSTOM"] as Recurrence[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => update("recurrence", r)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${
                    values.recurrence === r
                      ? "border-foreground bg-foreground text-background"
                      : "border-line text-foreground/70"
                  }`}
                >
                  {r.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {values.recurrence === "CUSTOM" && (
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => toggleCustomDay(i)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    values.customDays.includes(i)
                      ? "border-foreground bg-foreground text-background"
                      : "border-line text-foreground/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line px-4 py-2 text-sm text-foreground/70 hover:border-foreground/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
            >
              {saving ? "Saving…" : goal ? "Save changes" : "Add goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-foreground/[0.03] px-3 py-2 text-sm outline-none focus:border-foreground";
