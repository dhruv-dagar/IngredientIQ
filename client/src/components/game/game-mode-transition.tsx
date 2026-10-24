import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameModeConfig } from "@/lib/game-modes";
import { useTheme } from "@/context/ThemeContext";

interface GameModeTransitionProps {
  mode: GameModeConfig;
  onComplete: () => void;
}

const LOADING_TEXT = ["LO", "AD", "IN", "G"];

export function GameModeTransition({ mode, onComplete }: GameModeTransitionProps) {
  const [phase, setPhase] = useState(0);
  const { isLight } = useTheme();

  useEffect(() => {
    // Phase 1: Deal the cards
    const t1 = setTimeout(() => setPhase(1), 200); 
    // Phase 2: Wait for navigation
    const t2 = setTimeout(() => {
      setPhase(2); 
      onComplete(); 
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[100] perspective-[1200px]">
      
      <div className="absolute bottom-[15%] w-full max-w-4xl px-8 flex justify-between z-30 perspective-[1000px]">
        {LOADING_TEXT.map((text, i) => (
          <motion.div
            key={i}
            className="relative w-[200px] h-[300px]"
            initial={{ 
              scale: 0.3, 
              y: -300, // Starts behind the centered deck
              x: (1.5 - i) * 60, // Slightly clustered behind deck
              opacity: 0,
              rotateZ: (1.5 - i) * -10, // Fan out rotation
              rotateY: 0
            }}
            animate={phase >= 1 ? {
              scale: 1,
              y: 0,
              x: 0,
              opacity: 1,
              rotateZ: 0,
              rotateY: 0
            } : {}}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 14,
              delay: phase >= 1 ? i * 0.15 : 0 // Staggered dealing
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* The Dealing Card matching Game.jsx */}
            <div className={`absolute inset-0 rounded-2xl shadow-2xl border-4 p-2 flex items-center justify-center transition-colors ${
              isLight 
                ? "bg-[#FAF6EA] border-[#254174]" 
                : "bg-[#254174] border-[#F2EBD1]"
            }`}>
               <div className={`w-full h-full border-2 rounded-xl flex flex-col items-center justify-center text-center ${
                 isLight 
                   ? "border-[#254174]/40 bg-[#EDE4C8]" 
                   : "border-[#F2EBD1]/40 bg-[#0B1B42]"
               }`}>
                 <h2 className={`font-black text-6xl tracking-widest ${
                   isLight ? "text-[#000522]" : "text-[#F2EBD1]"
                 }`}>{text}</h2>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
