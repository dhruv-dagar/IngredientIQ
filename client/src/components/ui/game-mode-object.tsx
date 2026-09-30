import React, { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { CardPack } from "./card-pack";
import { GameModeConfig } from "@/lib/game-modes";
import { cn } from "@/lib/utils";

interface GameModeObjectProps {
  mode: GameModeConfig;
  relativeIndex: number;
  isActive: boolean;
  onClick: () => void;
  isDragging: boolean;
  isOpen?: boolean;
}

export function GameModeObject({ mode, relativeIndex, isActive, onClick, isDragging, isOpen }: GameModeObjectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Springs for smooth cursor tracking
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isOpen) return; // Disable hover tracking while dragging or transitioning
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Max rotation ±12 degrees
    const rX = ((y - height / 2) / (height / 2)) * -12;
    const rY = ((x - width / 2) / (width / 2)) * 12;

    rotateX.set(rX);
    rotateY.set(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleMouseEnter = () => {
    if (!isDragging && !isOpen) {
      setIsHovered(true);
    }
  };

  // Calculate base transforms from relative carousel position
  const getCarouselPosition = () => {
    // 0 = center
    // 1 = right, -1 = left
    // 2 = far right, -2 = far left
    
    // Scale down items further away
    const abs = Math.abs(relativeIndex);
    const scale = isActive ? 1 : abs === 1 ? 0.8 : 0.65;
    
    // TranslateX to space them horizontally
    const sign = Math.sign(relativeIndex);
    const translateX = sign * (abs === 1 ? 320 : 580);
    
    // Push back in Z space
    const translateZ = isActive ? 50 : abs === 1 ? -50 : -150;
    
    // Slight initial tilt for side items facing inwards
    const baseRotateY = isActive ? 0 : -sign * 15;
    
    // Opacity
    const opacity = isActive ? 1 : abs === 1 ? 0.8 : 0.5;
    
    return {
      x: translateX,
      z: translateZ,
      scale,
      baseRotateY,
      opacity,
      zIndex: 10 - abs
    };
  };

  const pos = getCarouselPosition();

  // Combine base positions with interactive cursor springs
  return (
    <motion.div
      ref={containerRef}
      className="absolute top-1/2 left-1/2 -mt-[240px] -ml-[170px] cursor-pointer touch-none"
      style={{
        transformStyle: "preserve-3d",
        zIndex: pos.zIndex,
      }}
      initial={false}
      animate={{
        x: pos.x,
        y: isActive ? -20 : 10,
        z: pos.z,
        scale: (isHovered && isActive && !isOpen) ? 1.05 : pos.scale,
        opacity: isOpen && !isActive ? 0 : pos.opacity,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          // Add base rotateY + cursor rotateY
          rotateY: useSpring(pos.baseRotateY, { stiffness: 200, damping: 30 })
        }}
        className="w-full h-full relative"
      >
        <CardPack mode={mode} isOpen={isOpen && isActive} className={cn(
          "transition-shadow duration-500",
          isActive && isHovered && !isOpen && "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        )} />
      </motion.div>
    </motion.div>
  );
}
