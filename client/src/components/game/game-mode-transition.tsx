import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameModeConfig } from "@/lib/game-modes";

interface GameModeTransitionProps {
  mode: GameModeConfig;
  onComplete: () => void;
}

const LOADING_TEXT = ["LO", "AD", "IN", "G"];

export function GameModeTransition({ mode, onComplete }: GameModeTransitionProps) {
  const [phase, setPhase] = useState(0);

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
            {/* The Red Card matching Game.jsx */}
            <div className="absolute inset-0 bg-[#b91c1c] rounded-xl shadow-2xl border-4 border-white/90 p-2 flex items-center justify-center">
               <div className="w-full h-full border-2 border-white/40 flex flex-col items-center justify-center text-center bg-[#a01313]">
                 <h2 className="text-white font-black text-6xl tracking-widest">{text}</h2>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
