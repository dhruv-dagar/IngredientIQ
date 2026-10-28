"use client";

import { CheckIcon } from "lucide-react";
import * as React from "react";
import type { CalendarDay, Modifiers } from "react-day-picker";
import { Calendar } from "@/components/ui/v-calendar-16-utils/calendar";
import { useTheme } from "@/context/ThemeContext";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

// Baseline demo days for rich visualization
const defaultCompletedDays = new Set(
  [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20].map((d) =>
    new Date(y, m, d).toDateString(),
  ),
);

interface DayButtonProps extends React.ComponentProps<"button"> {
  day: CalendarDay;
  modifiers: Modifiers;
}

interface ParticleProps {
  userStreak?: number;
  completedDaysSet?: Set<string>;
}

export default function Particle({ userStreak, completedDaysSet }: ParticleProps = {}) {
  const { isLight } = useTheme();

  // Combine default completed days with the user's active streak if available
  const completedDays = React.useMemo(() => {
    if (completedDaysSet) return completedDaysSet;
    const set = new Set(defaultCompletedDays);
    if (typeof userStreak === "number" && userStreak > 0) {
      for (let i = 0; i < userStreak; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (d.getMonth() === m && d.getFullYear() === y) {
          set.add(d.toDateString());
        }
      }
    }
    return set;
  }, [userStreak, completedDaysSet]);

  const HabitDayButton = React.useCallback(
    ({ day, modifiers, children, ...props }: DayButtonProps) => {
      const done = completedDays.has(day.date.toDateString());
      const isFuture = day.date > today;
      return (
        <button
          {...props}
          className={[
            props.className,
            done && !modifiers.selected
              ? isLight
                ? "relative bg-[#254174]/15 text-[#254174] font-black border border-[#254174]/30"
                : "relative bg-[#254174]/40 text-[#F2EBD1] font-black border border-[#254174]"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
          {done && !isFuture && (
            <CheckIcon
              className={`absolute right-0.5 bottom-0.5 size-2.5 ${
                isLight ? "text-[#254174]" : "text-[#F2EBD1]"
              }`}
            />
          )}
        </button>
      );
    },
    [completedDays, isLight],
  );

  const streak = [...completedDays].filter((d) => new Date(d) <= today && new Date(d).getMonth() === m).length;

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        components={{ DayButton: HabitDayButton }}
        disabled={{ after: today }}
        mode="single"
        onSelect={() => {}}
        selected={undefined}
      />
      <div
        className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
          isLight
            ? "border-[#254174]/30 bg-[#000522]/[0.03] text-[#000522]"
            : "border-[#254174]/40 bg-[#000522]/40 text-[#F2EBD1]"
        }`}
      >
        <span className={isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}>
          Days completed this month
        </span>
        <span className="font-mono text-sm font-black">
          {streak} / {today.getDate()}
        </span>
      </div>
    </div>
  );
}
