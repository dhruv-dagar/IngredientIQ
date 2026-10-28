"use client";

import { CheckIcon } from "lucide-react";
import * as React from "react";
import type { CalendarDay, Modifiers } from "react-day-picker";
import { Calendar } from "@/components/ui/v-calendar-16-utils/calendar";
import { useTheme } from "@/context/ThemeContext";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

interface DayButtonProps extends React.ComponentProps<"button"> {
  day: CalendarDay;
  modifiers: Modifiers;
}

interface ParticleProps {
  activeDays?: string[];
  userStreak?: number;
}

export default function Particle({ activeDays = [], userStreak = 0 }: ParticleProps) {
  const { isLight } = useTheme();

  // Active days set for instant O(1) lookup
  const activeDaysSet = React.useMemo(() => {
    return new Set(activeDays);
  }, [activeDays]);

  const HabitDayButton = React.useCallback(
    ({ day, modifiers, children, ...props }: DayButtonProps) => {
      // Format day.date as YYYY-MM-DD
      const yyyy = day.date.getFullYear();
      const mm = String(day.date.getMonth() + 1).padStart(2, "0");
      const dd = String(day.date.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const done = activeDaysSet.has(dateKey);
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
    [activeDaysSet, isLight],
  );

  // Count active days in the current month up to today
  const currentMonthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;
  const daysCompletedThisMonth = React.useMemo(() => {
    return activeDays.filter(
      (d) => d.startsWith(currentMonthPrefix) && new Date(d) <= today,
    ).length;
  }, [activeDays, currentMonthPrefix]);

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
          {daysCompletedThisMonth} / {today.getDate()}
        </span>
      </div>
    </div>
  );
}
