import React, { useState, useEffect } from "react";
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
  const [dragStartX, setDragStartX] = useState(0);

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
    setDragStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging || selectedModeId) return;
    
    const delta = e.clientX - dragStartX;
    // If they dragged far enough, advance the carousel
    if (Math.abs(delta) > 100) {
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
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectedModeId) return;
    // Throttle wheel events
    if (Math.abs(e.deltaX) > 30) {
      if (e.deltaX > 0) {
        setActiveIndex((prev) => (prev + 1) % modes.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + modes.length) % modes.length);
      }
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
      className="relative w-full h-[600px] flex items-center justify-center select-none"
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
