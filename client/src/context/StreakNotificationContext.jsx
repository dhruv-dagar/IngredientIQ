import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { useTheme } from "./ThemeContext";

const StreakNotificationContext = createContext({
  triggerStreakNotification: () => {}
});

export function StreakNotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const { isLight } = useTheme();
  const timerRef = useRef(null);

  const triggerStreakNotification = useCallback((dayNumber) => {
    if (!dayNumber) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const key = `streak_notified_${todayStr}_${dayNumber}`;
    if (sessionStorage.getItem(key)) return; // Already notified in this session today

    sessionStorage.setItem(key, "true");
    setNotification({ dayNumber });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4500);
  }, []);

  const dismissNotification = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  };

  return (
    <StreakNotificationContext.Provider value={{ triggerStreakNotification }}>
      {children}

      {/* Top of screen notification popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] pointer-events-auto select-none"
          >
            <div
              className={`flex items-center gap-3.5 px-5 py-3 rounded-full border-2 shadow-2xl backdrop-blur-md transition-colors ${
                isLight
                  ? "bg-[#FAF6EA] border-[#254174] text-[#000522] shadow-[0_15px_35px_rgba(37,65,116,0.3)]"
                  : "bg-[#0B1B42] border-[#254174] text-[#F2EBD1] shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  isLight
                    ? "bg-[#254174] text-[#FAF6EA]"
                    : "bg-[#254174] text-[#F2EBD1]"
                }`}
              >
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="pr-1">
                <p className="text-sm font-black uppercase tracking-wider leading-tight">
                  Day {notification.dayNumber} Logged In!
                </p>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    isLight ? "text-[#000522]/70" : "text-[#F2EBD1]/70"
                  }`}
                >
                  🔥 Active Streak: {notification.dayNumber}{" "}
                  {notification.dayNumber === 1 ? "Day" : "Days"}
                </p>
              </div>
              <button
                onClick={dismissNotification}
                className={`ml-2 p-1 rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? "text-[#000522]/50 hover:text-[#000522] hover:bg-black/5"
                    : "text-[#F2EBD1]/50 hover:text-[#F2EBD1] hover:bg-white/10"
                }`}
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StreakNotificationContext.Provider>
  );
}

export function useStreakNotification() {
  return useContext(StreakNotificationContext);
}
