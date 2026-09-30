import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CardPack } from "./ui/card-pack";
import { GAME_MODES } from "@/lib/game-modes";

const API_BASE = '/api/game';

const NOVA_LEVELS = [
  { level: 1, title: 'Tier 1', desc: 'Unprocessed' },
  { level: 2, title: 'Tier 2', desc: 'Ingredients' },
  { level: 3, title: 'Tier 3', desc: 'Processed' },
  { level: 4, title: 'Tier 4', desc: 'Ultra-Processed' },
];

const LOADING_TEXT = ["LO", "AD", "IN", "G"];

export default function Game() {
  const { token, refreshUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const hasStartedRef = useRef(false);

  const [sessionId, setSessionId] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);

  const [selectedNova, setSelectedNova] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [scorePopup, setScorePopup] = useState(null);

  const [score, setScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [rightGuesses, setRightGuesses] = useState(0);

  const [questionStartedAt, setQuestionStartedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingCards, setShowLoadingCards] = useState(false);
  const loadingTimerRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const startGame = async () => {
    try {
      setLoading(true);
      setShowLoadingCards(true); // Always show on initial game load
      setError(null);
      setSessionId(null);
      setCurrentQuestion(null);
      setQuestionNumber(0);
      setSelectedNova(null);
      setAnswerResult(null);
      setScorePopup(null);
      setScore(0);
      setTotalGuesses(0);
      setRightGuesses(0);
      setShowModal(false);

      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create game session');

      setSessionId(data.sessionId);
      setQuestionCount(data.questionCount || 10);
      await fetchQuestion(data.sessionId);
    } catch (err) {
      console.error('Start game error:', err);
      setError(err.message || 'Failed to start game');
      setLoading(false);
      setShowLoadingCards(false);
    }
  };

  const fetchQuestion = async (activeSessionId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedNova(null);
      setAnswerResult(null);
      setScorePopup(null);

      // Only show LOADING cards if server takes > 400ms (prevents flashing on fast connections)
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = setTimeout(() => {
        setShowLoadingCards(true);
      }, 400);

      const response = await fetch(`${API_BASE}/questions?sessionId=${encodeURIComponent(activeSessionId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get question');

      clearTimeout(loadingTimerRef.current);

      // Slight artificial delay only if we are currently showing loading cards,
      // so they don't vanish the instant they finish dealing out
      const artificialDelay = showLoadingCards ? 600 : 0;
      
      setTimeout(() => {
        setCurrentQuestion(data.food);
        setQuestionNumber(data.questionNumber);
        setQuestionStartedAt(Date.now());
        setLoading(false); 
        setShowLoadingCards(false);
      }, artificialDelay);

    } catch (err) {
      console.error('Fetch question error:', err);
      setError(err.message || 'Failed to load question');
      setLoading(false);
      setShowLoadingCards(false);
      clearTimeout(loadingTimerRef.current);
    }
  };

  const handleCardClick = async (level) => {
    if (selectedNova !== null || submitting || !currentQuestion || !sessionId || loading) return;

    setSelectedNova(level);
    setSubmitting(true);
    setError(null);

    const responseTimeMs = questionStartedAt ? Math.max(0, Date.now() - questionStartedAt) : 0;

    try {
      const response = await fetch(`${API_BASE}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          foodId: currentQuestion._id,
          guessedLevel: level,
          responseTimeMs,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit answer');

      setAnswerResult(data);
      setTotalGuesses((prev) => prev + 1);

      if (data.isCorrect) {
        setRightGuesses((prev) => prev + 1);
        setScore((prev) => prev + 10); 
      }

      if (data.pointsChange !== undefined) {
        setScorePopup({ value: data.pointsChange, id: Date.now().toString() });
      }

    } catch (err) {
      console.error('Submit answer error:', err);
      setSelectedNova(null);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!sessionId || submitting) return;
    if (totalGuesses >= questionCount) {
      finishGame();
      return;
    }
    await fetchQuestion(sessionId);
  };

  const finishGame = () => {
    setShowModal(true);
    refreshUser();
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startGame();
  }, []);

  const food = currentQuestion?.food || currentQuestion;
  const endlessModeConfig = GAME_MODES.find(m => m.id === 'endless');

  // Key drives the dealing animation.
  // When questionNumber changes (or if loading), it forces a re-deal!
  const dealKey = showLoadingCards ? `loading-${Date.now()}` : `question-${questionNumber}`;

  return (
    <div className="w-screen h-screen overflow-hidden fixed top-0 left-0 bg-[#d4d4d4] text-[#1a1a1a] flex flex-col perspective-[1200px]">
      
      {/* Dynamic Background: Blurs and dims when dealing/loading */}
      <div 
        className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.6),transparent_70%)] transition-all duration-700 ${showLoadingCards || !currentQuestion ? 'backdrop-blur-xl bg-black/10' : ''}`} 
      />

      {/* Top Bar HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <button onClick={finishGame} className="px-4 py-2 bg-transparent border border-black/20 text-[#1a1a1a] text-xs font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-colors">
            End Game
          </button>
          <button onClick={startGame} className="px-4 py-2 bg-transparent border border-black/20 text-[#1a1a1a] text-xs font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Restart
          </button>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600 m-0">Question</p>
            <p className="text-xl font-bold m-0">{questionNumber || 0} / {questionCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600 m-0">Accuracy</p>
            <p className="text-xl font-bold m-0">{totalGuesses > 0 ? Math.round((rightGuesses/totalGuesses)*100) : 0}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600 m-0">Score</p>
            <p className="text-xl font-bold text-[#d11124] m-0">{score}</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center pt-20">
        
        {/* The Card Pack (Decks the cards) */}
        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 z-10" style={{ transform: "scale(0.55)" }}>
           <CardPack mode={endlessModeConfig} isOpen={true} />
        </div>

        {/* Current Food Information */}
        <div className={`absolute top-[42%] text-center z-20 px-8 w-full transition-opacity duration-500 ${showLoadingCards ? 'opacity-0' : 'opacity-100'}`}>
           <h1 className="text-5xl font-bold mb-2 drop-shadow-md text-[#1a1a1a] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
             {food?.name || "..."}
           </h1>
           <p className="text-neutral-600 font-bold text-lg uppercase tracking-widest mt-2">{food?.brand}</p>
        </div>

        {/* Score Popup Animation */}
        <AnimatePresence>
          {scorePopup && (
            <motion.div 
              key={scorePopup.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -100, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className={`absolute top-[45%] font-bold text-4xl z-50 drop-shadow-lg ${scorePopup.value > 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {scorePopup.value > 0 ? '+' : ''}{scorePopup.value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Dealing Cards */}
        <div className="absolute bottom-[10%] w-full max-w-5xl px-8 flex justify-center gap-6 z-30 perspective-[1200px]">
          <AnimatePresence mode="popLayout">
            {NOVA_LEVELS.map((nova, i) => {
              const isSelected = selectedNova === nova.level;
              const isCorrect = answerResult && nova.level === Number(answerResult.actualLevel);
              const isWrongGuess = isSelected && !isCorrect;
              const textContent = showLoadingCards ? LOADING_TEXT[i] : nova.title;
              const descContent = showLoadingCards ? "" : nova.desc;

              // Aesthetic tilted layout
              // Card 0: tilted left
              // Card 1: slightly left
              // Card 2: slightly right
              // Card 3: tilted right
              const fanAngle = (i - 1.5) * 8; 
              const fanY = Math.abs(i - 1.5) * 15; // Arc effect

              return (
                <motion.div
                  key={`${dealKey}-${i}`} // Forces re-deal when key changes
                  initial={{ 
                    scale: 0.3, 
                    y: -400, // Starts way up inside the deck
                    x: (1.5 - i) * -30, // Clustered in the deck
                    opacity: 0,
                    rotateY: 180, // Back facing up
                    rotateZ: (1.5 - i) * -20 // Extreme fan in the deck
                  }}
                  animate={{
                    scale: 1,
                    y: fanY,
                    x: 0,
                    opacity: 1,
                    rotateY: (isSelected || isCorrect) && answerResult && !showLoadingCards ? 0 : 180, // Flip over if answered
                    rotateZ: isSelected ? 0 : fanAngle // Flatten out when selected
                  }}
                  exit={{
                    scale: 0.8,
                    opacity: 0,
                    y: 100, // Drop down to exit
                    transition: { duration: 0.2 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 110, 
                    damping: 14,
                    delay: i * 0.1 // Stagger dealing
                  }}
                  className={`relative w-[220px] h-[320px] cursor-pointer ${answerResult || loading ? 'pointer-events-none' : 'hover:-translate-y-6 hover:scale-105 transition-all duration-300'}`}
                  onClick={() => handleCardClick(nova.level)}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* BACK OF CARD (Red Side - Visible before guessing) */}
                  <div className="absolute inset-0 bg-[#d11124] rounded-[10px] shadow-2xl border-[6px] border-white p-2 flex items-center justify-center backface-hidden" style={{ transform: "rotateY(180deg)" }}>
                     <div className="w-full h-full border border-white/50 rounded-sm flex flex-col items-center justify-center text-center p-2">
                       {loading ? (
                         <h2 className="text-white font-black text-7xl tracking-widest">{textContent}</h2>
                       ) : (
                         <>
                           <span className="text-white text-5xl mb-4" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>♠</span>
                           <h2 className="text-white font-black text-3xl mb-1 uppercase tracking-widest">{textContent}</h2>
                           <p className="text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] px-2 leading-tight">{descContent}</p>
                         </>
                       )}
                     </div>
                  </div>

                  {/* FRONT OF CARD (White Side - Visible after guessing) */}
                  <div className={`absolute inset-0 bg-white rounded-[10px] shadow-2xl border-[6px] p-4 flex flex-col items-center justify-center text-center backface-hidden ${isCorrect ? 'border-green-500' : isWrongGuess ? 'border-red-500' : 'border-neutral-200'}`}>
                     <h3 className={`text-xl font-black mb-3 tracking-widest ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                       {isCorrect ? 'CORRECT' : 'YOUR GUESS'}
                     </h3>
                     <div className="w-full h-[2px] bg-neutral-200 mb-3" />
                     <p className="text-black font-black text-3xl mb-2">Tier {answerResult?.actualLevel}</p>
                     
                     {answerResult?.ingredientsText && (
                       <div className="text-[11px] text-neutral-600 mt-2 overflow-y-auto max-h-[100px] text-left leading-snug font-medium">
                         <strong className="text-black uppercase tracking-widest">Ingredients:</strong> {answerResult.ingredientsText}
                       </div>
                     )}
                  </div>

                  {/* Selected Indicator Glow */}
                  {isSelected && !answerResult && !loading && (
                    <div className="absolute -inset-4 bg-white/30 rounded-xl blur-xl -z-10" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Next Question Button */}
        <AnimatePresence>
          {answerResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 z-40"
            >
              <button 
                onClick={handleNext} 
                disabled={submitting}
                className="px-12 py-5 bg-[#1a1a1a] text-white font-black tracking-[4px] text-lg uppercase hover:scale-105 transition-transform rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              >
                {totalGuesses >= questionCount ? 'View Results' : 'Next Question →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Game Over Modal */}
      {showModal && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#f4efe8] text-[#1a1a1a] p-10 rounded-2xl max-w-md w-full text-center shadow-2xl border-4 border-white"
          >
            <h2 className="text-5xl font-bold mb-6 text-[#d11124]" style={{ fontFamily: '"Playfair Display", serif' }}>Game Over!</h2>
            <div className="space-y-4 mb-8 text-lg font-bold">
              <p className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-neutral-500 uppercase tracking-widest text-sm">Questions Played</span> 
                <span>{totalGuesses}</span>
              </p>
              <p className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-neutral-500 uppercase tracking-widest text-sm">Right Guesses</span> 
                <span className="text-green-600">{rightGuesses}</span>
              </p>
              <p className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-neutral-500 uppercase tracking-widest text-sm">Session Score</span> 
                <span className="text-[#d11124]">{score}</span>
              </p>
              <p className="flex justify-between pb-2">
                <span className="text-neutral-500 uppercase tracking-widest text-sm">Accuracy</span> 
                <span>{totalGuesses > 0 ? Math.round((rightGuesses / totalGuesses) * 100) : 0}%</span>
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={startGame} className="flex-1 py-4 bg-[#1a1a1a] text-white font-bold tracking-widest uppercase hover:bg-black transition-colors rounded-lg">
                Play Again
              </button>
              <button onClick={() => { refreshUser(); navigate('/dashboard'); }} className="flex-1 py-4 bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] font-bold tracking-widest uppercase hover:bg-black/5 transition-colors rounded-lg">
                Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}