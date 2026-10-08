import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GameModeConfig } from "@/lib/game-modes";
import { Lock } from "lucide-react";

interface CardPackProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: GameModeConfig;
  isOpen?: boolean;
}

const BOX_WIDTH = 340;
const BOX_HEIGHT = 480;
const BOX_DEPTH = 55;

export const CardPack = React.forwardRef<HTMLDivElement, CardPackProps>(
  ({ className, mode, isOpen = false, ...props }, ref) => {
    
    // Aesthetic colors matching the premium deck
    const isLocked = !mode.enabled;
    const baseColor = isLocked ? "bg-[#000522]/50" : "bg-[#0B1B42]"; // Ivory/off-white matching the photo
    const accentColor = isLocked ? "text-[#000522]/50" : "text-[#F2EBD1]"; // Deep bright red from photo
    const borderColor = isLocked ? "border-[#254174]/20" : "border-[#254174]/50"; // Slightly darker edge

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
        className={cn("relative", className)}
        style={{
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          transformStyle: "preserve-3d",
        }}
        {...props}
      >
        {/* CARDS INSIDE (Visible when lid is open and through the thumb notch) */}
        <div 
          className="absolute bg-[#F2EBD1] border border-[#254174]/30 rounded-[8px] shadow-md flex items-start justify-center"
          style={{ 
            transform: `translateZ(-${BOX_DEPTH / 2 - 4}px)`,
            width: BOX_WIDTH - 6,
            height: BOX_HEIGHT - 4,
            left: 3,
            top: 2,
          }}
        >
          {/* First Card Red Back (seen when looking inside) */}
          <div className="w-[94%] h-[98%] mt-2 border-2 border-[#254174] rounded-[6px] bg-[#000522] flex items-center justify-center p-1">
             <div className="w-full h-full border border-[#254174]/40 rounded-[4px] flex items-center justify-center">
                <span className="text-[#F2EBD1]/30 text-4xl"></span>
             </div>
          </div>
          
          {/* Card Edges Pattern (sides of the deck) */}
          <div className="absolute -left-[2px] top-[10px] w-[4px] h-[95%] bg-[repeating-linear-gradient(0deg,#F2EBD1_0px,#F2EBD1_2px,#d1c5a1_2px,#d1c5a1_4px)] opacity-80" />
          <div className="absolute -right-[2px] top-[10px] w-[4px] h-[95%] bg-[repeating-linear-gradient(0deg,#F2EBD1_0px,#F2EBD1_2px,#d1c5a1_2px,#d1c5a1_4px)] opacity-80" />
        </div>

        {/* BACK FACE */}
        <div
          className={cn("absolute inset-0 shadow-xl rounded-sm", baseColor, borderColor)}
          style={{
            transform: `translateZ(-${BOX_DEPTH / 2}px) rotateY(180deg)`,
            transformStyle: "preserve-3d",
          }}
        >
           {/* Simple back design */}
           <div className="absolute inset-4 border-2 border-[#254174] opacity-50" />
        </div>

        {/* BOTTOM FACE */}
        <div
          className={cn("absolute bottom-0 left-0 w-full origin-bottom rounded-sm", baseColor)}
          style={{
            height: BOX_DEPTH,
            transform: `translateZ(${BOX_DEPTH / 2}px) rotateX(-90deg)`,
          }}
        />

        {/* LEFT FACE */}
        <div
          className={cn("absolute top-0 left-0 h-full origin-left", baseColor)}
          style={{
            width: BOX_DEPTH,
            transform: `translateZ(${BOX_DEPTH / 2}px) rotateY(-90deg)`,
            borderRight: "1px solid rgba(0,0,0,0.05)"
          }}
        >
           {/* Left Top Flap */}
           <motion.div
             className={cn("absolute top-0 left-0 w-full h-[60px] origin-bottom shadow-md", baseColor)}
             initial={{ rotateX: 0 }}
             animate={{ rotateX: isOpen ? 120 : 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             style={{ transformOrigin: "top", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
           />
        </div>

        {/* RIGHT FACE */}
        <div
          className={cn("absolute top-0 right-0 h-full origin-right shadow-lg", baseColor)}
          style={{
            width: BOX_DEPTH,
            transform: `translateZ(${BOX_DEPTH / 2}px) rotateY(90deg)`,
            borderLeft: "1px solid rgba(0,0,0,0.05)"
          }}
        >
           {/* Right Top Flap */}
           <motion.div
             className={cn("absolute top-0 left-0 w-full h-[60px] origin-bottom shadow-md", baseColor)}
             initial={{ rotateX: 0 }}
             animate={{ rotateX: isOpen ? 120 : 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             style={{ transformOrigin: "top", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
           />
        </div>

        {/* TOP FLAP (Main Lid) */}
        <motion.div
          className={cn("absolute top-0 left-0 w-full origin-top z-30 rounded-t-sm shadow-xl", baseColor)}
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
           {/* Flap design underneath (matches photo red inner flap) */}
           <div className="absolute inset-2 bg-[#000522] border border-[#254174]/50 flex items-center justify-center" style={{ transform: "rotateX(180deg) translateZ(1px)" }}>
              <span className="text-[#F2EBD1] text-xl"></span>
           </div>

           {/* Tuck flap inside piece (the part that inserts) */}
           <div 
             className={cn("absolute bottom-full left-[10%] w-[80%] h-8 origin-bottom rounded-t-md shadow-sm", baseColor)}
             style={{ transform: 'rotateX(90deg)' }}
           />
        </motion.div>

        {/* FRONT FACE */}
        <div
          className={cn("absolute inset-0 shadow-sm overflow-hidden rounded-sm", baseColor)}
          style={{
            transform: `translateZ(${BOX_DEPTH / 2}px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Subtle texture/grain */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          {/* Fake Thumb Notch Cutout */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[50px] h-[25px] bg-[#F2EBD1] rounded-b-full border-b border-[#254174] shadow-inner z-20 flex items-start justify-center overflow-hidden" 
          >
            {/* Show a tiny bit of red card back through the hole */}
            <div className="w-[120%] h-[200%] bg-[#000522] -mt-1 rounded-sm" />
          </div>

          {/* Decorative Red Border Layer */}
          <div 
            className="absolute inset-[14px] border-[4px] p-[6px] flex flex-col items-center justify-between rounded-sm"
            style={{ 
              transform: "translateZ(1px)",
              borderColor: isLocked ? "rgba(255,255,255,0.1)" : "#254174"
            }}
          >
            {/* Inner Red Border */}
            <div className="absolute inset-2 border border-[#254174] rounded-sm" />

            {/* Top Ornate Area / Title */}
            <div className={cn("w-full pt-8 pb-2 text-center z-10", accentColor)}>
               <h3 className={cn("text-2xl font-bold leading-none tracking-[0.2em] uppercase", isLocked ? "text-[#000522]/40" : "text-[#F2EBD1]")}>
                 {mode.title}
               </h3>
            </div>

            {/* Center Large Black Spade */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10" style={{ transform: "translateZ(2px)" }}>
               {isLocked ? (
                 <Lock className="w-20 h-20 text-neutral-600 mb-2" />
               ) : (
                 <div className="flex items-center justify-center">
                   <span className="text-[#F2EBD1] text-[160px] leading-[0.8] drop-shadow-[0_0_20px_rgba(242,235,209,0.3)]">{getSuit(mode.id)}</span>
                 </div>
               )}
               {isLocked && <p className="text-sm text-[#000522]/50 font-bold tracking-widest mt-6">LOCKED</p>}
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
