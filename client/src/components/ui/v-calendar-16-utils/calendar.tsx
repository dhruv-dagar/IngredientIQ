import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 select-none", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "flex justify-center pt-1 relative items-center mb-3",
        caption_label: "text-sm font-black uppercase tracking-widest",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-lg border border-current/25 hover:bg-current/10 transition-colors cursor-pointer",
        button_next:
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-lg border border-current/25 hover:bg-current/10 transition-colors cursor-pointer",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday:
          "opacity-60 rounded-md w-9 font-bold text-[0.75rem] uppercase tracking-wider text-center",
        week: "flex w-full mt-1.5 justify-between",
        day: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center",
        day_button:
          "h-9 w-9 p-0 font-bold rounded-lg transition-colors flex items-center justify-center hover:bg-current/10 cursor-pointer",
        selected: "bg-[#254174] text-[#F2EBD1]",
        today: "font-black underline decoration-2 decoration-[#254174]",
        outside: "opacity-25",
        disabled: "opacity-25 cursor-not-allowed hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
        ...props.components,
      }}
      {...props}
    />
  );
}
