import { useTheme } from "../../context/ThemeContext";

export default function Footer() {
  const { isLight } = useTheme();

  return (
    <footer 
      className="fixed bottom-0 inset-x-0 z-30 pointer-events-none py-2 flex items-center justify-center select-none"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div 
        className={`px-4 py-1.5 rounded-full backdrop-blur-md border text-[10px] sm:text-xs font-semibold tracking-wider transition-colors duration-500 shadow-sm flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center pointer-events-auto ${
          isLight
            ? "bg-[#F2EBD1]/85 border-[#254174]/25 text-[#000522]/80 shadow-[0_2px_10px_rgba(37,65,116,0.1)]"
            : "bg-[#000522]/85 border-[#254174]/40 text-[#F2EBD1]/80 shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        }`}
      >
        <span>© 2026 CoSyLab, IIIT-Delhi. All Rights Reserved.</span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span className="opacity-75">Functional storage is used strictly to preserve game progress & streaks.</span>
      </div>
    </footer>
  );
}
