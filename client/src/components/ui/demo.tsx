import React from "react";
import { LiquidGlassCarousel } from "@/components/ui/liquid-glass-carousel";

export default function Page() {
  return (
    <div className="h-screen w-full">
      <LiquidGlassCarousel entry={false} />
    </div>
  );
}
