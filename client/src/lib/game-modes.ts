export type GameModeId = "daily" | "endless" | "timeAttack" | "settings" | "comingSoon";

export interface GameModeConfig {
  id: GameModeId;
  title: string;
  description: string;
  route: string | null;
  enabled: boolean;
}

export const GAME_MODES: GameModeConfig[] = [
  {
    id: "daily",
    title: "Daily Challenge",
    description: "Complete today's challenge and climb the streak.",
    route: "/daily",
    enabled: true,
  },
  {
    id: "endless",
    title: "Endless Mode",
    description: "Survive as long as possible with endless ingredients.",
    route: "/game",
    enabled: true,
  },
  {
    id: "timeAttack",
    title: "Time Attack",
    description: "Test your speed in a rapid-fire ingredient challenge.",
    route: null,
    enabled: true,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure your game preferences and audio.",
    route: null,
    enabled: true,
  },
  {
    id: "comingSoon",
    title: "Coming Soon",
    description: "More exciting modes are on the way.",
    route: null,
    enabled: false,
  },
];
