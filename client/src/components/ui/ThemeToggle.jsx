import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle({ className = "", fixed = false }) {
  const { theme, toggleTheme, isLight } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle light/dark theme"
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
      className={`relative z-50 flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg transition-colors cursor-pointer select-none ${
        fixed ? "fixed top-6 right-6" : ""
      } ${
        isLight
          ? "bg-[#E5DEC3] border-[#254174] text-[#000522] hover:bg-[#254174] hover:text-[#F2EBD1] shadow-[0_4px_15px_rgba(37,65,116,0.15)]"
          : "bg-[#0B1B42]/90 border-[#254174] text-[#F2EBD1] hover:bg-[#254174] shadow-[0_4px_20px_rgba(0,5,34,0.6)]"
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {isLight ? (
          <Moon className="w-4 h-4 text-[#254174] fill-[#254174]/20" />
        ) : (
          <Sun className="w-4 h-4 text-amber-300 fill-amber-300/30" />
        )}
      </motion.div>
      <span className="text-[11px] font-black uppercase tracking-wider pr-1">
        {isLight ? "Light" : "Dark"}
      </span>
    </motion.button>
  );
}
