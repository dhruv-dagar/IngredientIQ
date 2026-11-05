import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function LoadingScreen({ message = "Loading IngredientIQ..." }) {
  const { isLight } = useTheme();

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-500 ${
      isLight ? "bg-[#F2EBD1] text-[#000522]" : "bg-[#000522] text-[#F2EBD1]"
    }`}>
      {/* Background radial glow */}
      <div className={`absolute inset-0 pointer-events-none ${
        isLight 
          ? "bg-[radial-gradient(circle_at_50%_45%,rgba(37,65,116,0.12),transparent_70%)]" 
          : "bg-[radial-gradient(circle_at_50%_45%,rgba(37,65,116,0.35),transparent_70%)]"
      }`} />

      {/* Center animation */}
      <motion.div 
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="flex flex-col items-center gap-4 z-10"
      >
        <span className={`text-6xl ${
          isLight ? "text-[#254174]" : "text-[#F2EBD1] drop-shadow-[0_0_20px_rgba(242,235,209,0.8)]"
        }`}>
          ♠
        </span>
        <h2 
          className="text-xl sm:text-2xl font-black tracking-widest uppercase text-center"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          {message}
        </h2>
        <div className="flex gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-[#254174] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#254174] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#254174] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>

      {/* Bottom Storage Notice */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center px-4 z-10 select-none">
        <p className={`text-[11px] sm:text-xs font-semibold tracking-wider text-center max-w-md ${
          isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
        }`}>
          Functional storage is used strictly to preserve game progress & streaks.
        </p>
      </div>
    </div>
  );
}
