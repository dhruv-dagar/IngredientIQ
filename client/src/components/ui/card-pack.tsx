import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GameModeConfig } from "@/lib/game-modes";
import { Lock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface CardPackProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: GameModeConfig;
  isOpen?: boolean;
}

const BOX_WIDTH = 340;
const BOX_HEIGHT = 480;
const BOX_DEPTH = 55;

export const CardPack = React.forwardRef<HTMLDivElement, CardPackProps>(
  ({ className, mode, isOpen = false, ...props }, ref) => {
    const { isLight } = useTheme();
    const isLocked = !mode.enabled;

    // Palette & shades of cream for physical 3D tuck box
    // Dark Mode: Deep Navy Box (#0B1B42) with Cream Accents (#F2EBD1)
    // Light Mode: Luxury Ivory/Cream Box (layered cream tones: #FAF6EA, #E5DCBE, #DDD3B2, #D5CBA8) with Midnight Navy Accents (#000522)
    const frontBase = isLight
      ? (isLocked ? "bg-[#E5DEC3]/80" : "bg-[#FAF6EA]")
      : (isLocked ? "bg-[#000522]/60" : "bg-[#0B1B42]");

    const backBase = isLight
      ? (isLocked ? "bg-[#E5DEC3]/80" : "bg-[#F0E9D5]")
      : (isLocked ? "bg-[#000522]/60" : "bg-[#0B1B42]");

    const leftBase = isLight
      ? (isLocked ? "bg-[#DCD2B3]/80" : "bg-[#E5DCBE]")
      : (isLocked ? "bg-[#000522]/70" : "bg-[#081535]");

    const rightBase = isLight
      ? (isLocked ? "bg-[#D4C9A6]/80" : "bg-[#DDD3B2]")
      : (isLocked ? "bg-[#000522]/75" : "bg-[#06112C]");

    const bottomBase = isLight
      ? (isLocked ? "bg-[#CCC09B]/80" : "bg-[#D5CBA8]")
      : (isLocked ? "bg-[#000522]/80" : "bg-[#040C20]");

    const topLidBase = isLight
      ? (isLocked ? "bg-[#EFE8D3]/80" : "bg-[#FDFBF5]")
      : (isLocked ? "bg-[#000522]/65" : "bg-[#0D204E]");

    const accentColor = isLight
      ? (isLocked ? "text-[#000522]/40" : "text-[#000522]")
      : (isLocked ? "text-[#F2EBD1]/30" : "text-[#F2EBD1]");

    const borderColor = isLight
      ? (isLocked ? "border-[#254174]/20" : "border-[#254174]")
      : (isLocked ? "border-[#254174]/20" : "border-[#254174]/50");

    const innerBorderColor = isLight
      ? (isLocked ? "border-[#254174]/15" : "border-[#254174]/50")
      : (isLocked ? "border-[#254174]/20" : "border-[#254174]");

    const getSuit = (id: string) => {
      switch (id) {
        case 'daily': return '♥';
        case 'endless': return '♠';
        case 'timeAttack': return '♣';
        case 'settings': return '♦';
        default: return '★';
      }
    };

    return (
      <div
        ref={ref}
        className={cn("relative transition-all duration-500", className)}
        style={{
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          transformStyle: "preserve-3d",
        }}
        {...props}
      >
        {/* CARDS INSIDE (Visible when lid is open and through the thumb notch) */}
        <div 
          className={cn(
            "absolute rounded-[8px] shadow-md flex items-start justify-center transition-colors duration-500",
            isLight ? "bg-[#0B1B42] border border-[#254174]/40" : "bg-[#F2EBD1] border border-[#254174]/30"
          )}
          style={{ 
            transform: `translateZ(-${BOX_DEPTH / 2 - 4}px)`,
            width: BOX_WIDTH - 6,
            height: BOX_HEIGHT - 4,
            left: 3,
            top: 2,
          }}
        >
          {/* First Card Back (seen when looking inside) */}
          <div className={cn(
            "w-[94%] h-[98%] mt-2 border-2 rounded-[6px] flex items-center justify-center p-1 transition-colors duration-500",
            isLight ? "bg-[#254174] border-[#254174]/70" : "bg-[#000522] border-[#254174]"
          )}>
             <div className={cn(
               "w-full h-full border rounded-[4px] flex items-center justify-center",
               isLight ? "border-[#F2EBD1]/20" : "border-[#254174]/40"
             )}>
                <span className="text-4xl select-none opacity-20">♠</span>
             </div>
          </div>
          
          {/* Card Edges Pattern (sides of the deck) */}
          <div 
            className="absolute -left-[2px] top-[10px] w-[4px] h-[95%] opacity-80" 
            style={{
              background: isLight
                ? "repeating-linear-gradient(0deg,#FAF6EA 0px,#FAF6EA 2px,#D8CEAD 2px,#D8CEAD 4px)"
                : "repeating-linear-gradient(0deg,#F2EBD1 0px,#F2EBD1 2px,#d1c5a1 2px,#d1c5a1 4px)"
            }}
          />
          <div 
            className="absolute -right-[2px] top-[10px] w-[4px] h-[95%] opacity-80" 
            style={{
              background: isLight
                ? "repeating-linear-gradient(0deg,#FAF6EA 0px,#FAF6EA 2px,#D8CEAD 2px,#D8CEAD 4px)"
                : "repeating-linear-gradient(0deg,#F2EBD1 0px,#F2EBD1 2px,#d1c5a1 2px,#d1c5a1 4px)"
            }}
          />
        </div>

        {/* BACK FACE */}
        <div
          className={cn("absolute inset-0 shadow-xl rounded-sm transition-colors duration-500", backBase, borderColor)}
          style={{
            transform: `translateZ(-${BOX_DEPTH / 2}px) rotateY(180deg)`,
            transformStyle: "preserve-3d",
          }}
        >
           {/* Simple back design */}
           <div className={cn(
             "absolute inset-4 border-2 opacity-50 transition-colors duration-500",
             isLight ? "border-[#254174]" : "border-[#254174]"
           )} />
        </div>

        {/* BOTTOM FACE */}
        <div
          className={cn("absolute bottom-0 left-0 w-full origin-bottom rounded-sm transition-colors duration-500", bottomBase)}
          style={{
            height: BOX_DEPTH,
            transform: `translateZ(${BOX_DEPTH / 2}px) rotateX(-90deg)`,
          }}
        />

        {/* LEFT FACE */}
        <div
          className={cn("absolute top-0 left-0 h-full origin-left transition-colors duration-500", leftBase)}
          style={{
            width: BOX_DEPTH,
            transform: `translateZ(${BOX_DEPTH / 2}px) rotateY(-90deg)`,
            borderRight: isLight ? "1px solid rgba(0,5,34,0.08)" : "1px solid rgba(0,0,0,0.05)"
          }}
        >
           {/* Left Top Flap */}
           <motion.div
             className={cn("absolute top-0 left-0 w-full h-[60px] origin-bottom shadow-md transition-colors duration-500", leftBase)}
             initial={{ rotateX: 0 }}
             animate={{ rotateX: isOpen ? 120 : 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             style={{ transformOrigin: "top", borderBottom: isLight ? "1px solid rgba(0,5,34,0.08)" : "1px solid rgba(0,0,0,0.05)" }}
           />
        </div>

        {/* RIGHT FACE */}
        <div
          className={cn("absolute top-0 right-0 h-full origin-right shadow-lg transition-colors duration-500", rightBase)}
          style={{
            width: BOX_DEPTH,
            transform: `translateZ(${BOX_DEPTH / 2}px) rotateY(90deg)`,
            borderLeft: isLight ? "1px solid rgba(0,5,34,0.08)" : "1px solid rgba(0,0,0,0.05)"
          }}
        >
           {/* Right Top Flap */}
           <motion.div
             className={cn("absolute top-0 left-0 w-full h-[60px] origin-bottom shadow-md transition-colors duration-500", rightBase)}
             initial={{ rotateX: 0 }}
             animate={{ rotateX: isOpen ? 120 : 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             style={{ transformOrigin: "top", borderBottom: isLight ? "1px solid rgba(0,5,34,0.08)" : "1px solid rgba(0,0,0,0.05)" }}
           />
        </div>

        {/* TOP FLAP (Main Lid) */}
        <motion.div
          className={cn("absolute top-0 left-0 w-full origin-top z-30 rounded-t-sm shadow-xl transition-colors duration-500", topLidBase)}
          style={{
            height: BOX_DEPTH,
            transformStyle: "preserve-3d",
          }}
          initial={{ rotateX: 90, translateZ: BOX_DEPTH / 2 }}
          animate={{
            rotateX: isOpen ? 200 : 90, // Opens fully back
          }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
           {/* Flap design underneath (inner flap) */}
           <div 
             className={cn(
               "absolute inset-2 border flex items-center justify-center transition-colors duration-500",
               isLight ? "bg-[#254174] border-[#FAF6EA]/30" : "bg-[#000522] border-[#254174]/50"
             )} 
             style={{ transform: "rotateX(180deg) translateZ(1px)" }}
           >
              <span className={cn("text-xl select-none", isLight ? "text-[#FAF6EA]/50" : "text-[#F2EBD1]/40")}>♣</span>
           </div>

           {/* Tuck flap inside piece (the part that inserts) */}
           <div 
             className={cn("absolute bottom-full left-[10%] w-[80%] h-8 origin-bottom rounded-t-md shadow-sm transition-colors duration-500", topLidBase)}
             style={{ transform: 'rotateX(90deg)' }}
           />
        </motion.div>

        {/* FRONT FACE */}
        <div
          className={cn("absolute inset-0 shadow-md overflow-hidden rounded-sm transition-colors duration-500", frontBase)}
          style={{
            transform: `translateZ(${BOX_DEPTH / 2}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Subtle texture/grain */}
          <div className={cn(
            "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none",
            isLight ? "opacity-20" : "opacity-40"
          )} />
          
          {/* Fake Thumb Notch Cutout */}
          <div 
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-[50px] h-[25px] rounded-b-full border-b shadow-inner z-20 flex items-start justify-center overflow-hidden transition-colors duration-500",
              isLight ? "bg-[#254174] border-[#0B1B42]" : "bg-[#F2EBD1] border-[#254174]"
            )} 
          >
            {/* Show card peek through hole */}
            <div className={cn(
              "w-[120%] h-[200%] -mt-1 rounded-sm transition-colors duration-500",
              isLight ? "bg-[#FAF6EA]" : "bg-[#000522]"
            )} />
          </div>

          {/* Decorative Border Layer */}
          <div 
            className={cn(
              "absolute inset-[14px] border-[4px] p-[6px] flex flex-col items-center justify-between rounded-sm transition-colors duration-500",
              borderColor
            )}
            style={{ 
              transform: "translateZ(1px)",
            }}
          >
            {/* Inner Border */}
            <div className={cn("absolute inset-2 border rounded-sm transition-colors duration-500", innerBorderColor)} />

            {/* Top Ornate Area / Title */}
            <div className={cn("w-full pt-8 pb-2 text-center z-10", accentColor)}>
               <h3 className={cn("text-2xl font-bold leading-none tracking-[0.2em] uppercase")}>
                 {mode.title}
               </h3>
            </div>

            {/* Center Large Suit (♠, ♥, ♣, ♦) */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10" style={{ transform: "translateZ(2px)" }}>
               {isLocked ? (
                 <Lock className={cn("w-20 h-20 mb-2", isLight ? "text-[#000522]/40" : "text-neutral-600")} />
               ) : (
                 <div className="flex items-center justify-center">
                   <span className={cn(
                     "text-[160px] leading-[0.8] select-none transition-all duration-300",
                     accentColor,
                     isLight 
                       ? "drop-shadow-[0_4px_12px_rgba(0,5,34,0.18)]" 
                       : "drop-shadow-[0_0_20px_rgba(242,235,209,0.3)]"
                   )}>
                     {getSuit(mode.id)}
                   </span>
                 </div>
               )}
               {isLocked && <p className={cn("text-sm font-bold tracking-widest mt-6", isLight ? "text-[#000522]/50" : "text-[#000522]/50")}>LOCKED</p>}
            </div>

            {/* Bottom info */}
            <div className={cn("w-full py-4 text-center text-xs font-bold uppercase tracking-[0.2em] z-10", accentColor)}>
              Ingredient IQ
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CardPack.displayName = "CardPack";
