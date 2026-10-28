import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Particle from "./v-calendar-16";

export default function StreakButton({ className = "" }) {
  const { user } = useContext(AuthContext);
  const { isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const streak = user?.dailyStreak || 0;
  const maxStreak = user?.maxDailyStreak || streak || 0;

  return (
    <>
      {/* Streak Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        type="button"
        aria-label="View Daily Streak Calendar"
        title={`Daily Streak: ${streak} day${streak === 1 ? "" : "s"}`}
        className={`relative z-50 flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg transition-colors cursor-pointer select-none ${
          isLight
            ? "bg-[#E5DEC3] border-[#254174] text-[#000522] hover:bg-[#254174] hover:text-[#F2EBD1] shadow-[0_4px_15px_rgba(37,65,116,0.15)]"
            : "bg-[#0B1B42]/90 border-[#254174] text-[#F2EBD1] hover:bg-[#254174] shadow-[0_4px_20px_rgba(0,5,34,0.6)]"
        } ${className}`}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {/* Flame icon strictly matching palette (Ocean Blue #254174) */}
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

      {/* Streak Calendar Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#000522]/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`relative z-10 w-full max-w-sm rounded-[2rem] border-4 p-6 shadow-2xl transition-colors ${
                isLight
                  ? "bg-[#E5DEC3] border-[#254174]/40 text-[#000522] shadow-[0_0_80px_rgba(37,65,116,0.25)]"
                  : "bg-[#0B1B42] border-[#254174] text-[#F2EBD1] shadow-[0_0_90px_rgba(37,65,116,0.6)]"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 mb-2 border-b border-[#254174]/30">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
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
                      className={`text-lg font-black tracking-wide leading-tight ${
                        isLight ? "text-[#000522]" : "text-[#F2EBD1]"
                      }`}
                      style={{ fontFamily: '"Playfair Display", serif' }}
                    >
                      Daily Streak
                    </h3>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${
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
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isLight
                      ? "border-[#254174]/30 text-[#000522] hover:bg-[#254174] hover:text-[#F2EBD1]"
                      : "border-[#254174]/50 text-[#F2EBD1] hover:bg-[#254174]"
                  }`}
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Streak Stats Ribbon */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    isLight
                      ? "bg-[#000522]/[0.04] border-[#254174]/20"
                      : "bg-[#000522]/50 border-[#254174]/50"
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase font-bold tracking-widest block ${
                      isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                    }`}
                  >
                    Current Streak
                  </span>
                  <span className="text-xl font-black font-mono">
                    {streak} {streak === 1 ? "Day" : "Days"}
                  </span>
                </div>
                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    isLight
                      ? "bg-[#000522]/[0.04] border-[#254174]/20"
                      : "bg-[#000522]/50 border-[#254174]/50"
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase font-bold tracking-widest block ${
                      isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                    }`}
                  >
                    Best Streak
                  </span>
                  <span className="text-xl font-black font-mono text-amber-500 dark:text-amber-300">
                    {maxStreak} {maxStreak === 1 ? "Day" : "Days"}
                  </span>
                </div>
              </div>

              {/* The Habit Calendar Component */}
              <div className="mt-2">
                <Particle userStreak={streak} />
              </div>

              {/* Tip */}
              <p
                className={`text-[10px] text-center font-medium mt-3 ${
                  isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                }`}
              >
                Play Daily Challenge, Endless, or Time Attack every day to keep your streak glowing!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
