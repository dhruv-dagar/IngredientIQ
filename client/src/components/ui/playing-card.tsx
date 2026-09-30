import React from "react";
import { cn } from "@/lib/utils";

interface PlayingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  face?: "front" | "back";
}

export const PlayingCard = React.forwardRef<HTMLDivElement, PlayingCardProps>(
  ({ className, face = "back", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 rounded-lg shadow-sm border border-neutral-200/20 overflow-hidden",
          face === "back" ? "bg-[#8b0000]" : "bg-white",
          className
        )}
        {...props}
      >
        {face === "back" ? (
          <div className="w-full h-full p-2">
            {/* Ornate back pattern abstraction */}
            <div className="w-full h-full border-2 border-white/40 rounded-sm flex items-center justify-center p-1">
               <div className="w-full h-full border border-white/20 rounded-sm flex items-center justify-center bg-white/5" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-red-700 bg-white shadow-inner">
            {/* Abstract front face */}
            <span className="text-4xl">♦</span>
          </div>
        )}
      </div>
    );
  }
);

PlayingCard.displayName = "PlayingCard";
