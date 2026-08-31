"use client";

import { useEffect, useState } from "react";
import GoalCard from "@/components/GoalCard";
import GoalFormModal, { GoalFormValues } from "@/components/GoalFormModal";
import ProgressBar from "@/components/ProgressBar";
import { apiFetch } from "@/lib/apiFetch";
import { todayStr } from "@/lib/dates";
import { useDayGoals } from "@/lib/useDayGoals";
import type { GoalTemplate } from "@/lib/types";

export default function GoalsPage() {
  const today = todayStr();
  const { day, loading, error: dayError, reload, toggle } = useDayGoals(today);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalTemplate | null>(null);

  async function loadTemplates() {
    const res = await apiFetch("/api/goals");
    if (res.ok) {
      const data: { goals: GoalTemplate[] } = await res.json();
      setTemplates(data.goals);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadAll() {
    await Promise.all([reload(), loadTemplates()]);
  }

  async function handleCreate(values: GoalFormValues): Promise<string | void> {
    const res = await apiFetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Couldn't create that goal";
    await loadAll();
  }

  async function handleUpdate(id: string, values: GoalFormValues): Promise<string | void> {
    const res = await apiFetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Couldn't update that goal";
    await loadAll();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this goal? This can't be undone.")) return;
    const res = await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) await loadAll();
    else setError("Couldn't delete that goal.");
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="micro-label mb-2">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="headline text-3xl sm:text-4xl">Today&rsquo;s Goals ↘</h1>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setModalOpen(true);
          }}
          className="shrink-0 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          + Add goal
        </button>
      </div>

      {(error || dayError) && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error ?? dayError}
        </p>
      )}

      {loading ? (
        <p className="micro-label">Loading…</p>
      ) : !day || day.goals.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} hasTemplates={templates.length > 0} />
      ) : (
        <>
          <div className="mb-8 rounded-card border border-line p-5">
            <ProgressBar pointsEarned={day.score.pointsEarned} pointsPossible={day.score.pointsPossible} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {day.goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                editable
                onToggle={(subIndex, completed) => toggle(goal, subIndex, completed)}
                onEdit={() => {
                  const template = templates.find((t) => t.id === goal.id) ?? null;
                  setEditingGoal(template);
                  setModalOpen(true);
                }}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <GoalFormModal
          goal={editingGoal}
          onClose={() => setModalOpen(false)}
          onSubmit={(values) =>
            editingGoal ? handleUpdate(editingGoal.id, values) : handleCreate(values)
          }
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd, hasTemplates }: { onAdd: () => void; hasTemplates: boolean }) {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-16 text-center">
      <p className="headline mb-2 text-xl">
        {hasTemplates ? "Nothing scheduled for today." : "No goals yet."}
      </p>
      <p className="mb-6 text-sm text-foreground/60">
        {hasTemplates
          ? "None of your goals recur today — add one or check back tomorrow."
          : "Add your first goal to start tracking your daily grade."}
      </p>
      <button
        onClick={onAdd}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
      >
        + Add goal
      </button>
    </div>
  );
}
