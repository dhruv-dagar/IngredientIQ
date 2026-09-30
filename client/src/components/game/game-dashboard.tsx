import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { GameModeCarousel } from '../ui/game-mode-carousel';
import { GameModeTransition } from './game-mode-transition';
import { GAME_MODES, GameModeConfig } from '@/lib/game-modes';
import { motion, AnimatePresence } from 'framer-motion';

const getBadge = (level: number) => {
  if (level === 1) return { icon: '🌱', title: 'Novice' };
  if (level === 2) return { icon: '🍳', title: 'Apprentice' };
  if (level === 3) return { icon: '👨‍🍳', title: 'Expert' };
  return { icon: '👑', title: 'Master' };
};

export default function GameDashboard() {
  const { user, logout, refreshUser } = useContext(AuthContext);
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
    <div className="w-screen h-screen overflow-hidden fixed top-0 left-0 bg-[#d4d4d4] text-[#1a1a1a] perspective-[1200px]">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_70%)]" />

      {/* Top Left HUD */}
      <motion.div 
        className="absolute top-10 left-10 z-50"
      >
        <h1 className="text-4xl mb-5 border-b-2 border-black/20 pb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
          IngredientIQ
        </h1>
        
        <div className="flex flex-col gap-4">
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-neutral-600">Player</p>
            <p className="m-0 text-lg font-bold">{user.username}</p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-neutral-600">Tier</p>
            <p className="m-0 text-lg font-bold text-[#d11124]">{badge.title} {badge.icon}</p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-neutral-600">Score</p>
            <p className="m-0 text-lg font-bold">{user.totalPoints || 0} PTS</p>
          </div>
        </div>

        <button 
          onClick={() => { logout(); navigate('/login'); }} 
          className="mt-8 px-5 py-2 bg-transparent border border-black/20 text-[#1a1a1a] cursor-pointer uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-colors"
        >
          Log Out
        </button>
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-500 text-sm tracking-widest uppercase"
      >
        Drag horizontally to explore • Click center deck to play
      </motion.div>
    </div>
  );
}
