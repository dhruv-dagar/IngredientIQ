import React, { useState, useContext, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Particle from "./v-calendar-16";

export default function StreakButton({ className = "" }) {
  const { user } = useContext(AuthContext);
  const { isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const streak = user?.dailyStreak || 0;
  const maxStreak = user?.maxDailyStreak || streak || 0;
  const activeDays = user?.activeDays || [];

  // Close popover when clicking outside or pressing Escape (no full screen blur)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Streak Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-label="View Daily Streak Calendar"
        aria-expanded={isOpen}
        title={`Daily Streak: ${streak} day${streak === 1 ? "" : "s"}`}
        className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border shadow-md transition-colors cursor-pointer select-none ${
          isLight
            ? "bg-[#FAF6EA] border-[#254174]/40 text-[#000522] hover:bg-[#254174] hover:text-[#FAF6EA] shadow-[0_4px_15px_rgba(37,65,116,0.12)]"
            : "bg-[#0B1B42]/90 border-[#254174] text-[#F2EBD1] hover:bg-[#254174] shadow-[0_4px_20px_rgba(0,5,34,0.6)]"
        }`}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {/* Flame icon strictly matching palette (#254174) */}
          <Flame
            className={`w-4 h-4 transition-colors ${
              isLight
                ? "text-[#254174] fill-[#254174]/25"
                : "text-[#254174] fill-[#254174]/40 drop-shadow-[0_0_8px_rgba(37,65,116,0.9)]"
            }`}
          />
        </motion.div>
        <span className="text-[11px] font-black uppercase tracking-wider pr-0.5">
          {streak} {streak === 1 ? "Day" : "Days"}
        </span>
      </motion.button>

      {/* Anchored Popover (comes right where pressed, NO screen blur) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute right-0 top-full mt-2.5 z-[150] w-[330px] sm:w-[350px] max-w-[calc(100vw-1.5rem)] rounded-2xl border-2 p-5 shadow-2xl transition-colors ${
              isLight
                ? "bg-[#FAF6EA] border-[#254174]/40 text-[#000522] shadow-[0_16px_45px_rgba(37,65,116,0.25)]"
                : "bg-[#0B1B42] border-[#254174] text-[#F2EBD1] shadow-[0_20px_60px_rgba(0,5,34,0.85)]"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 mb-2 border-b border-[#254174]/30">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isLight
                      ? "bg-[#254174]/10 border-[#254174]/30 text-[#254174]"
                      : "bg-[#000522] border-[#254174]/50 text-[#F2EBD1]"
                  }`}
                >
                  <Flame
                    className={`w-5 h-5 ${
                      isLight
                        ? "text-[#254174] fill-[#254174]/30"
                        : "text-[#254174] fill-[#254174]/50 drop-shadow-[0_0_10px_rgba(37,65,116,1)]"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`text-base font-black tracking-wide leading-tight ${
                      isLight ? "text-[#000522]" : "text-[#F2EBD1]"
                    }`}
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    Daily Streak
                  </h3>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                    }`}
                  >
                    Active Habit Calendar
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? "border-[#254174]/30 text-[#000522] hover:bg-[#254174] hover:text-[#FAF6EA]"
                    : "border-[#254174]/50 text-[#F2EBD1] hover:bg-[#254174]"
                }`}
                aria-label="Close"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Streak Stats Ribbon */}
            <div className="grid grid-cols-2 gap-2 my-2.5">
              <div
                className={`p-2 rounded-xl border text-center ${
                  isLight
                    ? "bg-[#000522]/[0.04] border-[#254174]/20"
                    : "bg-[#000522]/50 border-[#254174]/50"
                }`}
              >
                <span
                  className={`text-[8.5px] uppercase font-bold tracking-widest block ${
                    isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                  }`}
                >
                  Current Streak
                </span>
                <span className="text-lg font-black font-mono">
                  {streak} {streak === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div
                className={`p-2 rounded-xl border text-center ${
                  isLight
                    ? "bg-[#000522]/[0.04] border-[#254174]/20"
                    : "bg-[#000522]/50 border-[#254174]/50"
                }`}
              >
                <span
                  className={`text-[8.5px] uppercase font-bold tracking-widest block ${
                    isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                  }`}
                >
                  Best Streak
                </span>
                <span className="text-lg font-black font-mono">
                  {maxStreak} {maxStreak === 1 ? "Day" : "Days"}
                </span>
              </div>
            </div>

            {/* The Habit Calendar Component */}
            <div className="mt-1">
              <Particle activeDays={activeDays} userStreak={streak} />
            </div>

            {/* Tip */}
            <p
              className={`text-[9.5px] text-center font-medium mt-2.5 ${
                isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
              }`}
            >
              Play daily to keep your streak glowing!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
