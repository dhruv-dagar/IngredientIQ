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
        className="absolute top-10 left-10 z-50 bg-[#f4efe8] p-6 rounded-2xl shadow-2xl border-[8px] border-white max-w-[250px]"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#d11124]"></div>
        
        <h1 className="text-3xl mb-5 border-b border-black/10 pb-2 text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
          IngredientIQ
        </h1>
        
        <div className="flex flex-col gap-3">
          <div className="bg-white p-2 rounded-lg border border-black/5 text-center">
            <p className="m-0 text-[10px] uppercase tracking-widest text-neutral-500">Player</p>
            <p className="m-0 text-md font-black">{user.username}</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-black/5 text-center">
            <p className="m-0 text-[10px] uppercase tracking-widest text-neutral-500">Tier</p>
            <p className="m-0 text-md font-black text-[#d11124]">{badge.title} {badge.icon}</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-black/5 text-center">
            <p className="m-0 text-[10px] uppercase tracking-widest text-neutral-500">Score</p>
            <p className="m-0 text-md font-black">{user.totalPoints || 0} PTS</p>
          </div>
        </div>

        <button 
          onClick={() => { logout(); navigate('/login'); }} 
          className="mt-6 w-full py-3 bg-[#1a1a1a] text-white rounded-lg font-black uppercase tracking-widest hover:bg-[#d11124] transition-colors text-xs shadow-md"
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
