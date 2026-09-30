import { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LiquidGlassCarousel } from '@/components/ui/liquid-glass-carousel';

const getBadge = (level) => {
  if (level === 1) return { icon: '🌱', title: 'Novice' };
  if (level === 2) return { icon: '🍳', title: 'Apprentice' };
  if (level === 3) return { icon: '👨‍🍳', title: 'Expert' };
  return { icon: '👑', title: 'Master' };
};

// Generates a stunning gradient card with the mode name on it!
const generateCardTexture = (title, colorHex) => {
  if (typeof document === 'undefined') return ''; 
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  
  // Solid Base
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 900, 1200);
  
  // Soft light-to-dark gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, 1200);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 1200);
  
  // Elegant Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, 780, 1080);
  
  // Text Styling
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px "Playfair Display", "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Split long titles into two lines
  const words = title.split(' ');
  if (words.length > 1 && title.length > 9) {
     ctx.fillText(words[0], 450, 520);
     ctx.fillText(words.slice(1).join(' '), 450, 660);
  } else {
     ctx.fillText(title, 450, 600);
  }

  // Small subtitle
  ctx.font = '30px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('INGREDIENT IQ', 450, 1050);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};

const MODES = [
  { id: 'daily', title: 'Daily Challenge', route: '/daily', color: '#3b82f6' }, // Vibrant Blue
  { id: 'endless', title: 'Endless Mode', route: '/game', color: '#f43f5e' },   // Vibrant Rose
  { id: 'timed', title: 'Time Attack', route: null, color: '#10b981' },         // Vibrant Emerald
  { id: 'settings', title: 'Settings', route: null, color: '#8b5cf6' }          // Vibrant Purple
];

function Dashboard() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  // Generate the image assets on the fly so we don't need external URLs
  const carouselItems = useMemo(() => {
    return MODES.map(mode => ({
      title: mode.title,
      src: generateCardTexture(mode.title, mode.color),
      route: mode.route
    }));
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  if (!user) return <div style={{padding: '20px'}}>Loading...</div>;
  const badge = getBadge(user.level);
  const activeMode = carouselItems[activeIndex];

  return (
    <div className="w-screen h-screen overflow-hidden fixed top-0 left-0 bg-[#fafafa]">
      
      {/* Top Left HUD */}
      <div 
        className="absolute top-10 left-10 z-50 text-black transition-opacity duration-500"
        style={{ opacity: focused ? 0 : 1, pointerEvents: focused ? 'none' : 'auto' }}
      >
        <h1 className="text-4xl mb-5 border-b-2 border-black pb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
          IngredientIQ
        </h1>
        
        <div className="flex flex-col gap-4">
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-gray-500">Player</p>
            <p className="m-0 text-lg font-bold">{user.username}</p>
          </div>
          
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-gray-500">Tier</p>
            <p className="m-0 text-lg font-bold">{badge.title} {badge.icon}</p>
          </div>
          
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-gray-500">Score</p>
            <p className="m-0 text-lg font-bold">{user.totalPoints} PTS</p>
          </div>
        </div>

        <button 
          onClick={() => { logout(); navigate('/login'); }} 
          className="mt-8 px-5 py-2 bg-transparent border border-black text-black cursor-pointer uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          Log Out
        </button>
      </div>

      {/* The Liquid Glass 3D Carousel Component */}
      <LiquidGlassCarousel 
        items={carouselItems} 
        onActiveChange={setActiveIndex} 
        onFocusChange={setFocused} 
        background="#fafafa"
        entry={true}
      />

      {/* Play Button Overlay - Appears when a card is clicked/focused */}
      <div 
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
        style={{ 
          opacity: focused ? 1 : 0, 
          pointerEvents: focused ? 'auto' : 'none',
          transform: `translate(-50%, ${focused ? '0' : '20px'})`
        }}
      >
        <button 
          onClick={() => activeMode?.route && navigate(activeMode.route)}
          className="px-10 py-4 bg-black text-white font-bold tracking-[3px] uppercase hover:scale-105 transition-transform"
        >
          {activeMode?.route ? 'PLAY NOW' : 'COMING SOON'}
        </button>
      </div>

    </div>
  );
}

export default Dashboard;
