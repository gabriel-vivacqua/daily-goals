import { gradeToColor } from "@/lib/grade";

const STOPS = Array.from({ length: 11 }, (_, i) => i * 10);

export default function GradeLegend() {
  return (
    <div className="flex items-center gap-3">
      <span className="micro-label !text-[10px]">0%</span>
      <div
        className="h-2.5 flex-1 rounded-full"
        style={{
          background: `linear-gradient(to right, ${STOPS.map((g) => gradeToColor(g)).join(", ")})`,
        }}
      />
      <span className="micro-label !text-[10px]">100%</span>
    </div>
  );
}
