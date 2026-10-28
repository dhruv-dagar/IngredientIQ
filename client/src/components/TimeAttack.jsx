import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CardPack } from "./ui/card-pack";
import { GAME_MODES } from "@/lib/game-modes";
import { parseIngredients } from "@/lib/utils";
import { useTheme } from "../context/ThemeContext";
import { useStreakNotification } from "../context/StreakNotificationContext";
import ThemeToggle from "./ui/ThemeToggle";
import StreakButton from "./ui/StreakButton";

const API_BASE = '/api/time-attack';
const GAME_DURATION = 60; // 60 seconds blitz

const NOVA_LEVELS = [
  { level: 1, title: 'Tier 1', desc: 'Unprocessed' },
  { level: 2, title: 'Tier 2', desc: 'Ingredients' },
  { level: 3, title: 'Tier 3', desc: 'Processed' },
  { level: 4, title: 'Tier 4', desc: 'Ultra-Processed' },
];

export default function TimeAttack() {
  const { token, refreshUser, updateUser, user } = useContext(AuthContext);
  const { isLight } = useTheme();
  const { triggerStreakNotification } = useStreakNotification();
  const navigate = useNavigate();

  // Game lifecycle: 'ready' | 'playing' | 'finishing' | 'finished'
  const [gameState, setGameState] = useState('ready');
  const [sessionId, setSessionId] = useState(null);
  const [currentFood, setCurrentFood] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [cardsAnswered, setCardsAnswered] = useState(0);

  const [selectedNova, setSelectedNova] = useState(null);
  const [scorePopup, setScorePopup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isLandscape, setIsLandscape] = useState(false);
  const [enlargedCard, setEnlargedCard] = useState(null);

  const [finalResults, setFinalResults] = useState(null);

  const timerRef = useRef(null);
  const questionStartedAtRef = useRef(Date.now());
  const isFinishingRef = useRef(false);

  // Time Attack mode config (Club suit ♣)
  const timeAttackModeConfig = GAME_MODES.find(m => m.id === 'timeAttack') || {
    id: 'timeAttack',
    title: 'Time Attack',
    description: '60s Blitz',
    route: '/time-attack',
    enabled: true
  };

  // Reset card layout when question changes
  useEffect(() => {
    setIsLandscape(false);
    setEnlargedCard(null);
    setSelectedNova(null);
  }, [questionNumber, currentFood?._id]);

  const handleImageLoad = (e) => {
    if (e.target.naturalWidth > e.target.naturalHeight) {
      setIsLandscape(true);
    }
  };

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, sessionId]);

  // Start Time Attack Session
  const startSession = async () => {
    try {
      setError(null);
      setSubmitting(true);
      isFinishingRef.current = false;
      setFinalResults(null);
      setTimeLeft(GAME_DURATION);
      setCardsAnswered(0);

      const res = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start Time Attack session');

      setSessionId(data.sessionId);
      setCurrentFood(data.card);
      setQuestionNumber(data.questionNumber || 1);
      questionStartedAtRef.current = Date.now();
      setGameState('playing');
    } catch (err) {
      console.error('Time Attack start error:', err);
      setError(err.message || 'Failed to initialize session');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Answer
  const handleCardClick = async (level) => {
    if (gameState !== 'playing' || submitting || !currentFood || !sessionId) return;

    setSelectedNova(level);
    setSubmitting(true);

    const responseTimeMs = Math.max(0, Date.now() - questionStartedAtRef.current);

    try {
      const response = await fetch(`${API_BASE}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          foodId: currentFood._id,
          guessedLevel: level,
          responseTimeMs
        })
      });

      const data = await response.json();

      if (data.isExpired) {
        finishSession();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record answer');
      }

      if (data.dailyStreak) {
        if (updateUser) {
          updateUser({
            dailyStreak: data.dailyStreak,
            maxDailyStreak: data.maxDailyStreak,
            activeDays: data.activeDays
          });
        }
        if (data.isFirstActivityToday || data.streakIncremented) {
          triggerStreakNotification(data.dailyStreak);
        }
      }

      setCardsAnswered((prev) => prev + 1);

      // Flash quick popup
      setScorePopup({ text: `+1 Card`, id: Date.now().toString() });

      if (data.nextCard) {
        setCurrentFood(data.nextCard);
        setQuestionNumber(data.questionNumber);
        questionStartedAtRef.current = Date.now();
      } else {
        // Out of cards
        finishSession();
      }
    } catch (err) {
      console.error('Time Attack answer error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Finish session
  const finishSession = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    setGameState('finishing');
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const currentSessId = sessionId;
      if (!currentSessId) {
        setGameState('ready');
        return;
      }

      const response = await fetch(`${API_BASE}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: currentSessId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to finalize session');

      setFinalResults(data);
      if (data.user && updateUser) {
        updateUser({
          totalPoints: data.user.totalPoints,
          level: data.user.level,
          dailyStreak: data.user.dailyStreak,
          maxDailyStreak: data.user.maxDailyStreak,
          activeDays: data.user.activeDays
        });
      }
      refreshUser();
      setGameState('finished');
    } catch (err) {
      console.error('Time Attack finish error:', err);
      setError(err.message || 'Error tallying final score');
      setGameState('finished');
    }
  };

  const ingredientsList = currentFood ? parseIngredients(currentFood.ingredientsText) : [];
  const dealKey = `card-${questionNumber}-${currentFood?._id || 'none'}`;

  // Timer format (00:SS)
  const timerDisplay = `00:${String(timeLeft).padStart(2, '0')}`;
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft > 10 && timeLeft <= 20;

  return (
    <div className={`w-screen h-screen overflow-hidden fixed top-0 left-0 flex flex-col perspective-[1200px] transition-colors duration-500 ${
      isLight ? "bg-[#F2EBD1] text-[#000522]" : "bg-[#000522] text-[#F2EBD1]"
    }`}>
      
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 transition-all duration-700 ${
        isLight
          ? "bg-[radial-gradient(circle_at_50%_30%,rgba(37,65,116,0.12),transparent_70%)]"
          : "bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.4),transparent_70%)]"
      }`} />

      {/* Top Bar HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        
        {/* Left: Exit & Mode Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (gameState === 'playing' && !window.confirm("Abandon current Time Attack run?")) return;
              navigate('/dashboard');
            }} 
            className={`px-4 py-2 bg-transparent border text-xs font-bold uppercase tracking-widest transition-colors rounded-lg ${
              isLight 
                ? "border-[#254174] text-[#000522] hover:bg-[#254174] hover:text-[#F2EBD1]" 
                : "border-[#254174] text-[#F2EBD1] hover:bg-[#254174]"
            }`}
          >
            ← Exit
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-xl font-bold ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>♣</span>
            <span className={`text-sm font-black uppercase tracking-widest ${isLight ? "text-[#000522]/80" : "text-[#F2EBD1]/80"}`}>Time Attack</span>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        {gameState === 'playing' && (
          <div className="flex flex-col items-center">
            <div className={`flex items-center gap-2 px-5 py-1.5 rounded-full border-2 transition-all duration-300 shadow-xl ${
              isUrgent 
                ? 'bg-red-950/80 border-red-500 animate-pulse text-red-400' 
                : isWarning 
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300' 
                  : isLight
                    ? 'bg-[#E5DEC3] border-[#254174] text-[#000522]'
                    : 'bg-[#0B1B42]/90 border-[#254174] text-[#F2EBD1]'
            }`}>
              <span className="text-xs uppercase tracking-widest font-black opacity-70">Blitz</span>
              <span className="font-mono text-2xl font-black tracking-wider">
                {timerDisplay}
              </span>
            </div>
            {/* Countdown Bar */}
            <div className={`w-36 h-1.5 rounded-full mt-2 overflow-hidden border ${
              isLight ? "bg-[#000522]/10 border-[#254174]/20" : "bg-[#000522]/80 border-[#254174]/40"
            }`}>
              <motion.div 
                className={`h-full ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-[#254174]'}`}
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          </div>
        )}

        {/* Right: Counter & User Score */}
        <div className="flex items-center gap-4 text-right">
          <StreakButton />
          <ThemeToggle />
          {gameState === 'playing' && (
            <div className={`px-4 py-1.5 border rounded-xl shadow-lg ${
              isLight ? "bg-[#E5DEC3] border-[#254174]/40" : "bg-[#0B1B42]/80 border-[#254174]/60"
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-widest block ${
                isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
              }`}>Cards Dealt</span>
              <span className={`text-xl font-black ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>{cardsAnswered}</span>
            </div>
          )}
          <div>
            <p className={`m-0 text-[10px] uppercase tracking-widest ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>Player</p>
            <p className={`m-0 text-sm font-black ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>{user?.username || 'Chef'}</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center pt-20">
        
        {/* The Card Pack (Decks the cards) */}
        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 z-10" style={{ transform: "scale(0.55)" }}>
          <CardPack mode={timeAttackModeConfig} isOpen={gameState === 'playing'} />
        </div>

        {/* Backdrop overlay when card is enlarged */}
        <AnimatePresence>
          {enlargedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEnlargedCard(null)}
              className="fixed inset-0 bg-[#000522]/75 backdrop-blur-sm z-30 cursor-pointer"
            />
          )}
        </AnimatePresence>

        {/* Photo Card (Left) */}
        <AnimatePresence mode="wait">
          {gameState === 'playing' && currentFood && (
            <motion.div
              key={`photo-${questionNumber}`}
              initial={{ y: -100, opacity: 0, rotateZ: -5, scale: 0.5 }}
              animate={
                enlargedCard === 'photo' 
                ? { y: "-50%", x: "-50%", top: "50%", left: "50%", rotateZ: 0, scale: 1.5, zIndex: 100, opacity: 1 }
                : { y: 0, x: "-50%", top: "5%", left: "20%", rotateZ: -3, scale: 0.65, opacity: enlargedCard ? 0 : 1, zIndex: 20 }
              }
              onClick={() => enlargedCard !== 'photo' && setEnlargedCard('photo')}
              exit={{ y: -100, opacity: 0, rotateZ: -5, scale: 0.5 }}
              className={`absolute z-20 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-[#254174]/50 flex items-center justify-center pointer-events-auto cursor-pointer transition-opacity duration-300 ${
                isLight ? "bg-[#0B1B42]" : "bg-[#F2EBD1]"
              }`}
              style={{
                width: isLandscape ? 480 : 340,
                height: isLandscape ? 340 : 480,
                transformOrigin: "center center"
              }}
            >
              {enlargedCard === 'photo' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setEnlargedCard(null); }}
                  className="absolute top-3 right-3 bg-[#254174] text-[#F2EBD1] rounded-full w-9 h-9 flex items-center justify-center z-50 hover:bg-[#000522] font-black shadow-lg text-sm border-2 border-[#254174]/50 transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              )}
              <div className="w-full h-full bg-[#000522] flex items-center justify-center relative">
                {currentFood.imageUrl ? (
                  <img src={currentFood.imageUrl} alt="Food" onLoad={handleImageLoad} className="w-full h-full object-contain rounded-md" />
                ) : (
                  <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No Image</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ingredients Card (Right) */}
        <AnimatePresence mode="wait">
          {gameState === 'playing' && currentFood && (
            <motion.div
              key={`ingredients-${questionNumber}`}
              initial={{ y: -100, opacity: 0, rotateZ: 5, scale: 0.5 }}
              animate={
                enlargedCard === 'ingredients'
                ? { y: "-50%", x: "50%", top: "50%", right: "50%", rotateZ: 0, scale: 1.5, zIndex: 100, opacity: 1 }
                : { y: 0, x: "50%", top: "5%", right: "20%", rotateZ: 3, scale: 0.65, opacity: enlargedCard ? 0 : 1, zIndex: 20 }
              }
              onClick={() => enlargedCard !== 'ingredients' && setEnlargedCard('ingredients')}
              exit={{ y: -100, opacity: 0, rotateZ: 5, scale: 0.5 }}
              className={`absolute z-20 w-[340px] h-[480px] rounded-[2rem] shadow-2xl overflow-hidden border-4 border-[#254174]/50 flex flex-col pointer-events-auto cursor-pointer transition-opacity duration-300 ${
                isLight ? "bg-[#0B1B42] text-[#F2EBD1]" : "bg-[#F2EBD1] text-[#000522]"
              }`}
            >
              {enlargedCard === 'ingredients' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setEnlargedCard(null); }}
                  className="absolute top-3 right-3 bg-[#254174] text-[#F2EBD1] rounded-full w-9 h-9 flex items-center justify-center z-50 hover:bg-[#000522] font-black shadow-lg text-sm border-2 border-[#254174]/50 transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              )}
              <div className="w-full h-full p-6 flex flex-col cursor-auto">
                <div className={`flex items-center justify-between border-b-2 pb-3 mb-3 pr-8 ${
                  isLight ? "border-[#254174]/60" : "border-[#254174]/40"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${isLight ? "text-[#F2EBD1]" : "text-[#254174]"}`}>♣</span>
                    <strong className={`uppercase text-lg tracking-widest font-black ${
                      isLight ? "text-[#F2EBD1]" : "text-[#000522]"
                    }`}>
                      Ingredients
                    </strong>
                  </div>
                  {ingredientsList.length > 0 && (
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#254174] text-[#F2EBD1] shadow-sm">
                      {ingredientsList.length} {ingredientsList.length === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-1 overscroll-contain">
                  {ingredientsList.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-48 text-center ${
                      isLight ? "text-[#F2EBD1]/50" : "text-[#000522]/50"
                    }`}>
                      <span className="text-3xl mb-2">🌿</span>
                      <p className="font-bold text-xs uppercase tracking-widest">No Ingredients Listed</p>
                    </div>
                  ) : (
                    <ol className="flex flex-col gap-2 pb-2">
                      {ingredientsList.map((item, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${
                            isLight
                              ? "bg-[#000522]/40 border-[#254174]/40 hover:bg-[#000522]/60"
                              : "bg-[#000522]/[0.04] border-[#254174]/15 hover:bg-[#000522]/[0.08]"
                          }`}
                        >
                          <span className="shrink-0 flex items-center justify-center min-w-[26px] h-[22px] px-1.5 rounded-md bg-[#254174] text-[#F2EBD1] text-[11px] font-black tracking-tight shadow-sm mt-0.5">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[15px] font-semibold leading-snug break-words flex-1 ${
                            isLight ? "text-[#F2EBD1]" : "text-[#000522]"
                          }`}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Food Information (Floating Text) */}
        <div className={`absolute top-[42%] text-center z-20 px-8 w-full transition-opacity duration-300 pointer-events-none ${gameState !== 'playing' ? 'opacity-0' : 'opacity-100'}`}>
          <h1 className={`text-5xl font-bold mb-2 drop-shadow-md leading-tight ${
            isLight ? "text-[#000522]" : "text-[#F2EBD1]"
          }`} style={{ fontFamily: '"Playfair Display", serif' }}>
            {currentFood?.name || "..."}
          </h1>
          <p className={`font-bold text-lg uppercase tracking-widest mt-2 ${
            isLight ? "text-[#000522]/70" : "text-[#F2EBD1]/70"
          }`}>{currentFood?.brand}</p>
        </div>

        {/* Score Popup Animation */}
        <AnimatePresence>
          {scorePopup && (
            <motion.div 
              key={scorePopup.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -80, scale: 1.4 }}
              exit={{ opacity: 0 }}
              className="absolute top-[45%] font-bold text-3xl z-50 drop-shadow-lg text-emerald-400 font-mono tracking-widest"
            >
              {scorePopup.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Dealing Tier Cards (Fast interactive clicks) */}
        {gameState === 'playing' && (
          <div className="absolute bottom-[10%] w-full max-w-5xl px-8 flex justify-center gap-6 z-30 perspective-[1200px]">
            <AnimatePresence mode="popLayout">
              {NOVA_LEVELS.map((nova, i) => {
                const isSelected = selectedNova === nova.level;
                const fanAngle = (i - 1.5) * 8; 
                const fanY = Math.abs(i - 1.5) * 15;

                return (
                  <motion.div
                    key={`${dealKey}-${i}`}
                    initial={{ 
                      scale: 0.3, 
                      y: -300, 
                      opacity: 0,
                      rotateY: 180,
                      rotateZ: (1.5 - i) * -20 
                    }}
                    animate={{
                      scale: 1,
                      y: fanY,
                      x: 0,
                      opacity: 1,
                      rotateY: 180,
                      rotateZ: isSelected ? 0 : fanAngle,
                      zIndex: 30
                    }}
                    whileHover={{ y: fanY - 20, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 140, 
                      damping: 14,
                      delay: i * 0.05 
                    }}
                    className="relative w-[220px] h-[320px] cursor-pointer"
                    onClick={() => handleCardClick(nova.level)}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* BACK OF CARD (Visible interactive card) */}
                    <div 
                      className={`absolute inset-0 rounded-3xl shadow-2xl border-[6px] p-2 flex items-center justify-center transition-colors duration-200 ${
                        isSelected 
                          ? (isLight ? 'border-amber-500 bg-[#E5DEC3]' : 'border-amber-400 bg-[#0B1B42]')
                          : (isLight ? 'border-[#254174] bg-[#FAF6EA] shadow-[0_15px_35px_rgba(37,65,116,0.18)]' : 'border-[#F2EBD1] bg-[#254174] shadow-[0_15px_35px_rgba(0,0,0,0.6)]')
                      }`} 
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <div className={`w-full h-full border rounded-2xl flex flex-col items-center justify-center text-center p-2 transition-colors ${
                        isLight ? "border-[#254174]/40 bg-[#FAF6EA]" : "border-[#F2EBD1]/40"
                      }`}>
                        <span className={`text-5xl mb-4 transition-all duration-300 ${
                          isLight 
                            ? "text-[#000522] drop-shadow-[0_2px_8px_rgba(0,5,34,0.15)]" 
                            : "text-[#F2EBD1] drop-shadow-[0_0_10px_rgba(242,235,209,0.5)]"
                        }`}>♣</span>
                        <h2 className={`font-bold text-2xl mb-1 ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>{nova.title}</h2>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 leading-tight ${
                          isLight ? "text-[#000522]/80" : "text-[#F2EBD1]/90"
                        }`}>
                          {nova.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Pre-Game Intro Modal */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`p-10 rounded-[2.5rem] max-w-lg w-full text-center shadow-2xl border-4 transition-colors ${
              isLight
                ? "bg-[#E5DEC3] text-[#000522] border-[#254174]/50 shadow-[0_0_60px_rgba(37,65,116,0.2)]"
                : "bg-[#0B1B42] text-[#F2EBD1] border-[#254174] shadow-[0_0_80px_rgba(37,65,116,0.5)]"
            }`}
          >
            <div className={`w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center text-4xl mb-6 shadow-inner ${
              isLight
                ? "bg-[#254174]/15 border-[#254174] text-[#000522]"
                : "bg-[#254174]/30 border-[#254174] text-[#F2EBD1]"
            }`}>
              ♣
            </div>
            
            <h2 className={`text-4xl sm:text-5xl font-black mb-3 tracking-wide ${
              isLight ? "text-[#000522]" : "text-[#F2EBD1]"
            }`} style={{ fontFamily: '"Playfair Display", serif' }}>
              Time Attack
            </h2>
            <p className={`font-semibold text-sm leading-relaxed mb-8 max-w-md mx-auto ${
              isLight ? "text-[#000522]/80" : "text-[#F2EBD1]/70"
            }`}>
              You have <strong className={isLight ? "text-amber-700" : "text-amber-300"}>60 seconds</strong> on the clock. Rapidly classify each food into its NOVA Tier before the buzzer sounds. Speed and accuracy earn high-tier score multipliers!
            </p>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-xl mb-6">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={startSession} 
                disabled={submitting}
                className={`flex-1 py-4 font-black text-sm tracking-[0.2em] uppercase hover:scale-105 transition-all rounded-xl shadow-xl disabled:opacity-50 ${
                  isLight
                    ? "bg-[#254174] text-[#F2EBD1] hover:bg-[#0B1B42]"
                    : "bg-[#F2EBD1] text-[#000522] hover:bg-white"
                }`}
              >
                {submitting ? 'Dealing...' : 'Begin Blitz (60s)'}
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className={`py-4 px-6 bg-transparent border-2 font-bold text-xs tracking-widest uppercase transition-colors rounded-xl ${
                  isLight
                    ? "border-[#254174] text-[#000522] hover:bg-[#254174]/15"
                    : "border-[#254174] text-[#F2EBD1] hover:bg-[#254174]/30"
                }`}
              >
                Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Finishing Spinner */}
      {gameState === 'finishing' && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className={`w-16 h-16 border-4 rounded-full mb-6 ${
              isLight ? "border-[#254174]/30 border-t-[#254174]" : "border-[#254174] border-t-[#F2EBD1]"
            }`}
          />
          <h2 className={`text-3xl font-black tracking-widest uppercase ${
            isLight ? "text-[#000522]" : "text-[#F2EBD1]"
          }`}>Time's Up!</h2>
          <p className={`text-sm font-bold uppercase tracking-widest mt-2 ${
            isLight ? "text-[#000522]/70" : "text-[#F2EBD1]/60"
          }`}>Tallying your cards & bonuses...</p>
        </div>
      )}

      {/* Endgame Recap Modal */}
      {gameState === 'finished' && finalResults && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-lg flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`p-8 sm:p-10 rounded-[2.5rem] max-w-2xl w-full border-4 flex flex-col max-h-[90vh] transition-colors ${
              isLight
                ? "bg-[#E5DEC3] text-[#000522] border-[#254174]/60 shadow-[0_0_80px_rgba(37,65,116,0.3)]"
                : "bg-[#0B1B42] text-[#F2EBD1] border-[#254174] shadow-[0_0_90px_rgba(37,65,116,0.6)]"
            }`}
          >
            <div className="text-center mb-6 shrink-0">
              <span className={`text-4xl ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>♣</span>
              <h2 className={`text-4xl font-black mt-2 tracking-wide ${
                isLight ? "text-[#000522]" : "text-[#F2EBD1]"
              }`} style={{ fontFamily: '"Playfair Display", serif' }}>
                Blitz Complete!
              </h2>
              <p className={`text-xs uppercase tracking-widest font-bold mt-1 ${
                isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
              }`}>60-Second Time Attack Results</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 shrink-0">
              <div className={`p-4 rounded-2xl text-center border ${
                isLight 
                  ? "bg-[#000522]/[0.06] border-[#254174]/30" 
                  : "bg-[#000522]/50 border-[#254174]/60"
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-widest block mb-1 ${
                  isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                }`}>Answered</span>
                <span className={`text-2xl font-black ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>{finalResults.totalCards}</span>
              </div>
              <div className={`p-4 rounded-2xl text-center border ${
                isLight 
                  ? "bg-[#000522]/[0.06] border-[#254174]/30" 
                  : "bg-[#000522]/50 border-[#254174]/60"
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-widest block mb-1 ${
                  isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                }`}>Correct</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{finalResults.correctCount}</span>
              </div>
              <div className={`p-4 rounded-2xl text-center border ${
                isLight 
                  ? "bg-[#000522]/[0.06] border-[#254174]/30" 
                  : "bg-[#000522]/50 border-[#254174]/60"
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-widest block mb-1 ${
                  isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                }`}>Accuracy</span>
                <span className={`text-2xl font-black ${isLight ? "text-amber-700" : "text-amber-300"}`}>{finalResults.accuracy}%</span>
              </div>
              <div className={`p-4 rounded-2xl text-center border ${
                isLight 
                  ? "bg-[#000522]/[0.06] border-[#254174]/30" 
                  : "bg-[#000522]/50 border-[#254174]/60"
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-widest block mb-1 ${
                  isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
                }`}>Score</span>
                <span className={`text-2xl font-black ${
                  finalResults.pointsEarned >= 0 
                    ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                    : 'text-red-500'
                }`}>
                  {finalResults.pointsEarned >= 0 ? `+${finalResults.pointsEarned}` : finalResults.pointsEarned}
                </span>
              </div>
            </div>

            {/* Scrollable Cards Breakdown */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-3 min-h-[160px]">
              <p className={`text-xs font-bold uppercase tracking-widest sticky top-0 py-1 z-10 border-b ${
                isLight 
                  ? "bg-[#E5DEC3] text-[#000522]/60 border-[#254174]/30" 
                  : "bg-[#0B1B42] text-[#F2EBD1]/50 border-[#254174]/40"
              }`}>
                Card Breakdown ({finalResults.cardsPlayed?.length || 0})
              </p>
              {finalResults.cardsPlayed?.map((c, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3.5 ${
                    c.isCorrect 
                      ? (isLight ? 'bg-emerald-100/70 border-emerald-500/40' : 'bg-emerald-950/20 border-emerald-500/30') 
                      : (isLight ? 'bg-red-100/70 border-red-500/40' : 'bg-red-950/20 border-red-500/30')
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${
                    isLight ? "bg-[#254174]/15 border-[#254174]/30 text-[#000522]" : "bg-[#000522] border-[#254174]/40 text-[#F2EBD1]"
                  }`}>
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">♣</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-bold text-sm truncate ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>{c.name}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                        c.isCorrect 
                          ? (isLight ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                          : (isLight ? 'bg-red-200 text-red-800' : 'bg-red-500/20 text-red-300')
                      }`}>
                        {c.isCorrect ? 'Correct' : `Guessed T${c.guessedLevel}`}
                      </span>
                    </div>
                    <p className={`text-[11px] font-semibold mt-0.5 ${isLight ? "text-[#000522]/70" : "text-[#F2EBD1]/60"}`}>
                      Actual: <strong className={isLight ? "text-[#000522]" : "text-[#F2EBD1]"}>Tier {c.actualLevel}</strong> • Speed: {(c.responseTimeMs / 1000).toFixed(1)}s
                    </p>
                    {c.explanationText && (
                      <p className={`text-xs mt-1.5 leading-relaxed p-2 rounded-lg ${
                        isLight ? "text-[#000522]/90 bg-[#000522]/[0.05]" : "text-[#F2EBD1]/80 bg-[#000522]/30"
                      }`}>
                        {c.explanationText}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 shrink-0">
              <button 
                onClick={startSession} 
                className={`flex-1 py-4 font-black text-xs sm:text-sm tracking-[0.2em] uppercase hover:scale-105 transition-all rounded-xl shadow-lg ${
                  isLight
                    ? "bg-[#254174] text-[#F2EBD1] hover:bg-[#0B1B42]"
                    : "bg-[#F2EBD1] text-[#000522] hover:bg-white"
                }`}
              >
                Play Again
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className={`flex-1 py-4 bg-transparent border-2 font-bold text-xs sm:text-sm tracking-widest uppercase transition-colors rounded-xl ${
                  isLight
                    ? "border-[#254174] text-[#000522] hover:bg-[#254174]/15"
                    : "border-[#254174] text-[#F2EBD1] hover:bg-[#254174]/30"
                }`}
              >
                Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
