import { cn } from "@/lib/utils";

export interface DayEvent {
  label: string;
  tone: "blue" | "danger" | "warning" | "success";
}

export function CalendarMonth({
  year,
  month,
  today,
  eventsByDay,
}: {
  year: number;
  month: number; // 0-indexed
  today?: number;
  eventsByDay: Record<number, DayEvent[]>;
}) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const toneDot: Record<DayEvent["tone"], string> = {
    blue: "bg-blue-500",
    danger: "bg-danger-500",
    warning: "bg-warning-500",
    success: "bg-success-500",
  };

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-ink-400 uppercase tracking-wide py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => (
          <div
            key={i}
            className={cn(
              "min-h-[90px] rounded-xl p-2 border",
              day === null ? "border-transparent" : "border-ink-100 bg-white",
              day === today && "ring-2 ring-blue-500/40 border-blue-300"
            )}
          >
            {day !== null && (
              <>
                <p className={cn("text-[12px] font-medium", day === today ? "text-blue-600" : "text-ink-600")}>{day}</p>
                <div className="mt-1 space-y-1">
                  {(eventsByDay[day] ?? []).slice(0, 3).map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", toneDot[ev.tone])} />
                      <span className="text-[10px] text-ink-500 truncate">{ev.label}</span>
                    </div>
                  ))}
                  {(eventsByDay[day]?.length ?? 0) > 3 && (
                    <p className="text-[10px] text-ink-400">+{(eventsByDay[day]?.length ?? 0) - 3} more</p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
