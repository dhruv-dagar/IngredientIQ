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
    const baseColor = isLocked ? "bg-[#3a3a3a]" : "bg-[#f4efe8]"; // Ivory/off-white matching the photo
    const accentColor = isLocked ? "text-neutral-500" : "text-[#d11124]"; // Deep bright red from photo
    const borderColor = isLocked ? "border-[#4a4a4a]" : "border-[#e0d8cf]"; // Slightly darker edge

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
          className="absolute bg-white border border-neutral-200 rounded-[8px] shadow-md flex items-start justify-center"
          style={{ 
            transform: `translateZ(-${BOX_DEPTH / 2 - 4}px)`,
            width: BOX_WIDTH - 6,
            height: BOX_HEIGHT - 4,
            left: 3,
            top: 2,
          }}
        >
          {/* First Card Red Back (seen when looking inside) */}
          <div className="w-[94%] h-[98%] mt-2 border-2 border-white rounded-[6px] bg-[#d11124] flex items-center justify-center p-1">
             <div className="w-full h-full border border-white/40 rounded-[4px] flex items-center justify-center">
                <span className="text-white/30 text-4xl">♠</span>
             </div>
          </div>
          
          {/* Card Edges Pattern (sides of the deck) */}
          <div className="absolute -left-[2px] top-[10px] w-[4px] h-[95%] bg-[repeating-linear-gradient(0deg,#fff_0px,#fff_2px,#e5e5e5_2px,#e5e5e5_4px)] opacity-80" />
          <div className="absolute -right-[2px] top-[10px] w-[4px] h-[95%] bg-[repeating-linear-gradient(0deg,#fff_0px,#fff_2px,#e5e5e5_2px,#e5e5e5_4px)] opacity-80" />
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
           <div className="absolute inset-4 border-2 border-[#d11124] opacity-50" />
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
           <div className="absolute inset-2 bg-[#d11124] border border-[#a00] flex items-center justify-center" style={{ transform: "rotateX(180deg) translateZ(1px)" }}>
              <span className="text-white text-xl">♠</span>
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
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[50px] h-[25px] bg-white rounded-b-full border-b border-black/10 shadow-inner z-20 flex items-start justify-center overflow-hidden" 
          >
            {/* Show a tiny bit of red card back through the hole */}
            <div className="w-[120%] h-[200%] bg-[#d11124] -mt-1 rounded-sm" />
          </div>

          {/* Decorative Red Border Layer */}
          <div 
            className="absolute inset-[14px] border-[4px] p-[6px] flex flex-col items-center justify-between rounded-sm"
            style={{ 
              transform: "translateZ(1px)",
              borderColor: isLocked ? "rgba(255,255,255,0.1)" : "#d11124"
            }}
          >
            {/* Inner Red Border */}
            <div className="absolute inset-2 border border-[#d11124] rounded-sm" />

            {/* Top Ornate Area / Title */}
            <div className={cn("w-full pt-8 pb-2 text-center z-10", accentColor)}>
               <h3 className={cn("text-2xl font-bold leading-none tracking-[0.2em] uppercase", isLocked ? "text-neutral-400" : "text-[#d11124]")}>
                 {mode.title}
               </h3>
            </div>

            {/* Center Large Black Spade */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10" style={{ transform: "translateZ(2px)" }}>
               {isLocked ? (
                 <Lock className="w-20 h-20 text-neutral-600 mb-2" />
               ) : (
                 <div className="flex items-center justify-center">
                   <span className="text-[#1a1a1a] text-[160px] leading-[0.8]" style={{ textShadow: "0 2px 15px rgba(0,0,0,0.15)" }}>♠</span>
                 </div>
               )}
               {isLocked && <p className="text-sm text-neutral-500 font-bold tracking-widest mt-6">LOCKED</p>}
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
