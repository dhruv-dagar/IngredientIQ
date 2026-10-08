import React, { useState, useEffect, useRef } from "react";
import { GameModeConfig } from "@/lib/game-modes";
import { GameModeObject } from "./game-mode-object";

interface GameModeCarouselProps {
  modes: GameModeConfig[];
  onSelectMode: (mode: GameModeConfig) => void;
  selectedModeId?: string | null;
}

export function GameModeCarousel({ modes, onSelectMode, selectedModeId }: GameModeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const scrollAccumulator = useRef<number>(0);

  // Handle circular distance
  const getRelativeIndex = (index: number) => {
    const total = modes.length;
    let diff = index - activeIndex;
    const half = Math.floor(total / 2);
    
    if (diff > half) diff -= total;
    if (diff < -half) diff += total;
    
    return diff;
  };

  const handleDragStart = (e: React.PointerEvent) => {
    if (selectedModeId) return; // Disable drag if a mode is actively transitioning
    setIsDragging(true);
    setHasDragged(false);
    setDragStartX(e.clientX);
    
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging || selectedModeId) return;
    
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) > 5) setHasDragged(true);
    // If they dragged far enough, advance the carousel
    if (Math.abs(delta) > 40) {
      if (delta > 0) {
        // Dragged right -> Move active index Left (previous item)
        setActiveIndex((prev) => (prev - 1 + modes.length) % modes.length);
      } else {
        // Dragged left -> Move active index Right (next item)
        setActiveIndex((prev) => (prev + 1) % modes.length);
      }
      setDragStartX(e.clientX); // Reset start so we don't trigger multiple times in one long swipe
    }
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    setTimeout(() => setIsDragging(false), 50);
    
  };

            const handleWheel = (e: React.WheelEvent) => {
    if (selectedModeId) return;
    
    // Only use horizontal scrolling (deltaX)
    const rawDelta = e.deltaX;
    
    // Accumulate the scroll distance
    scrollAccumulator.current += rawDelta;
    
    // Higher threshold (300) so it requires a deliberate swipe, making it "appropriately smooth"
    const THRESHOLD = 300; 
    
    if (Math.abs(scrollAccumulator.current) > THRESHOLD) {
      const steps = Math.floor(Math.abs(scrollAccumulator.current) / THRESHOLD);
      const sign = Math.sign(scrollAccumulator.current);
      
      setActiveIndex((prev) => {
        let nextIndex = prev;
        if (sign > 0) {
          nextIndex = (prev + steps) % modes.length;
        } else {
          nextIndex = (prev - steps + modes.length * steps) % modes.length;
        }
        return nextIndex;
      });
      
      scrollAccumulator.current -= (sign * steps * THRESHOLD);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedModeId) return;
    if (e.key === "ArrowRight") {
      setActiveIndex((prev) => (prev + 1) % modes.length);
    } else if (e.key === "ArrowLeft") {
      setActiveIndex((prev) => (prev - 1 + modes.length) % modes.length);
    } else if (e.key === "Enter") {
      onSelectMode(modes[activeIndex]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, selectedModeId]);

  return (
    <div 
      className="relative w-full h-[600px] flex items-center justify-center select-none overscroll-x-none touch-pan-y"
      style={{ perspective: "1000px" }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      onWheel={handleWheel}
    >
      {modes.map((mode, index) => {
        const relativeIndex = getRelativeIndex(index);
        const isActive = relativeIndex === 0;
        const isTransitioning = selectedModeId === mode.id;

        return (
          <GameModeObject
            key={mode.id}
            mode={mode}
            relativeIndex={relativeIndex}
            isActive={isActive}
            isDragging={isDragging}
            isOpen={isTransitioning}
            onClick={() => {
              if (hasDragged) return;
              if (isActive && !selectedModeId) {
                onSelectMode(mode);
              } else if (!isActive && !selectedModeId) {
                setActiveIndex(index);
              }
            }}
          />
        );
      })}
    </div>
  );
}
