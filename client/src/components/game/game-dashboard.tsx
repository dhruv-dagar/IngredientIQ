import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GameModeCarousel } from '../ui/game-mode-carousel';
import { GameModeTransition } from './game-mode-transition';
import { GAME_MODES, GameModeConfig } from '@/lib/game-modes';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';

const getBadge = (level: number) => {
  if (level === 1) return { icon: '🌱', title: 'Novice' };
  if (level === 2) return { icon: '🍳', title: 'Apprentice' };
  if (level === 3) return { icon: '👨‍🍳', title: 'Expert' };
  return { icon: '👑', title: 'Master' };
};

export default function GameDashboard() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const { isLight } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, []);

  if (!user) return <div className="p-5">Loading...</div>;
  const badge = getBadge(user.level || 1);

  const handleSelectMode = (mode: GameModeConfig) => {
    if (!mode.enabled) return;
    if (mode.route) {
      navigate(mode.route);
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden fixed top-0 left-0 perspective-[1200px] transition-colors duration-500 ${
      isLight ? "bg-[#F2EBD1] text-[#000522]" : "bg-[#000522] text-[#F2EBD1]"
    }`}>
      
      {/* Background radial glow */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isLight 
          ? "bg-[radial-gradient(circle_at_50%_50%,rgba(37,65,116,0.12),transparent_70%)]" 
          : "bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_70%)]"
      }`} />

      {/* Top Left Title */}
      <div className="absolute top-10 left-10 z-50">
        <h1 
          className={`text-4xl font-black tracking-widest drop-shadow-xl transition-colors ${
            isLight ? "text-[#000522]" : "text-[#F2EBD1]"
          }`} 
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          IngredientIQ
        </h1>
      </div>

      {/* Top Right Floating HUD */}
      <motion.div 
        className="absolute top-10 right-10 z-50 flex flex-col items-end gap-3 max-w-[340px]"
      >
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className={`m-0 text-[10px] uppercase tracking-widest ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>
              Player
            </p>
            <p className={`m-0 text-lg font-black ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>
              {user.username}
            </p>
          </div>
          <div className={`w-px h-8 ${isLight ? "bg-[#254174]/30" : "bg-[#254174]/50"}`}></div>
          <div className="text-center">
            <p className={`m-0 text-[10px] uppercase tracking-widest ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>
              Tier
            </p>
            <p className={`m-0 text-lg font-black ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>
              {badge.title} {badge.icon}
            </p>
          </div>
          <div className={`w-px h-8 ${isLight ? "bg-[#254174]/30" : "bg-[#254174]/50"}`}></div>
          <div className="text-left">
            <p className={`m-0 text-[10px] uppercase tracking-widest ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>
              Score
            </p>
            <p className={`m-0 text-lg font-black ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>
              {user.totalPoints || 0} PTS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <ThemeToggle />
          <button 
            onClick={() => navigate('/')} 
            className={`px-5 py-2 bg-transparent border rounded-full font-bold uppercase tracking-widest transition-colors text-[10px] ${
              isLight 
                ? "text-[#000522] border-[#254174] hover:bg-[#254174] hover:text-[#F2EBD1]" 
                : "text-[#F2EBD1] border-[#254174] hover:bg-[#254174] hover:text-[#F2EBD1]"
            }`}
          >
            Home
          </button>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className={`px-5 py-2 rounded-full font-bold uppercase tracking-widest transition-colors text-[10px] shadow-lg ${
              isLight
                ? "bg-[#254174] text-[#F2EBD1] hover:bg-[#000522]"
                : "bg-[#254174] text-[#F2EBD1] hover:bg-[#F2EBD1] hover:text-[#000522]"
            }`}
          >
            Log Out
          </button>
        </div>
      </motion.div>

      {/* Main 3D Carousel */}
      <div className="absolute inset-0 flex items-center justify-center">
        <GameModeCarousel 
          modes={GAME_MODES} 
          onSelectMode={handleSelectMode} 
        />
      </div>

      {/* Bottom Hint */}
      <motion.div 
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 text-sm tracking-widest uppercase ${
          isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
        }`}
      >
        Drag horizontally to explore • Click center deck to play
      </motion.div>
    </div>
  );
}
