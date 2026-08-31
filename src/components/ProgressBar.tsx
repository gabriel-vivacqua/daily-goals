import { gradeToColor } from "@/lib/grade";

export default function ProgressBar({
  pointsEarned,
  pointsPossible,
}: {
  pointsEarned: number;
  pointsPossible: number;
}) {
  const pct = pointsPossible > 0 ? Math.min(100, (pointsEarned / pointsPossible) * 100) : 0;
  const grade = pointsPossible > 0 ? pct : null;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="micro-label">Today&rsquo;s progress</span>
        <span className="headline text-2xl">
          {grade === null ? "—" : `${grade.toFixed(0)}%`}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundColor: grade === null ? undefined : gradeToColor(grade) }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="micro-label !text-[10px]">{pointsEarned.toFixed(1)} pts earned</span>
        <span className="micro-label !text-[10px]">{pointsPossible.toFixed(1)} possible</span>
      </div>
    </div>
  );
}
