import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CardPack } from "./ui/card-pack";
import { GAME_MODES } from "@/lib/game-modes";
import { parseIngredients } from "@/lib/utils";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "./ui/ThemeToggle";

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
  const { isLight } = useTheme();
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
  const [isLandscape, setIsLandscape] = useState(false);
  const [enlargedCard, setEnlargedCard] = useState(null);

  useEffect(() => {
    // Reset landscape status when question changes
    setIsLandscape(false);
    setEnlargedCard(null);
  }, [currentQuestion]);

  const handleImageLoad = (e) => {
    if (e.target.naturalWidth > e.target.naturalHeight) {
      setIsLandscape(true);
    }
  };

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
  const ingredientsList = food ? parseIngredients(food.ingredientsText) : [];

  // Key drives the dealing animation.
  // When questionNumber changes (or if loading), it forces a re-deal!
  const dealKey = showLoadingCards ? `loading-${Date.now()}` : `question-${questionNumber}`;

  return (
    <div className={`w-screen h-screen overflow-hidden fixed top-0 left-0 flex flex-col perspective-[1200px] transition-colors duration-500 ${
      isLight ? "bg-[#F2EBD1] text-[#000522]" : "bg-[#000522] text-[#F2EBD1]"
    }`}>
      
      {/* Dynamic Background: Blurs and dims when dealing/loading */}
      <div 
        className={`absolute inset-0 transition-all duration-700 ${
          isLight
            ? "bg-[radial-gradient(circle_at_50%_30%,rgba(37,65,116,0.12),transparent_70%)]"
            : "bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.6),transparent_70%)]"
        } ${showLoadingCards || !currentQuestion ? 'backdrop-blur-xl bg-black/10' : ''}`} 
      />

      {/* Top Bar HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <button 
            onClick={finishGame} 
            className={`px-4 py-2 bg-transparent border text-xs font-bold uppercase tracking-widest transition-colors rounded-lg ${
              isLight 
                ? "border-[#254174] text-[#000522] hover:bg-[#254174] hover:text-[#F2EBD1]" 
                : "border-slate-200 text-[#F2EBD1] hover:bg-[#254174] hover:text-[#F2EBD1]"
            }`}
          >
            End Game
          </button>
          <button 
            onClick={startGame} 
            className={`px-4 py-2 bg-transparent border text-xs font-bold uppercase tracking-widest transition-colors rounded-lg ${
              isLight 
                ? "border-[#254174] text-[#000522] hover:bg-[#254174] hover:text-[#F2EBD1]" 
                : "border-slate-200 text-[#F2EBD1] hover:bg-[#254174] hover:text-[#F2EBD1]"
            }`}
          >
            Restart
          </button>
        </div>
        <div className="flex items-center gap-6 text-right">
          <ThemeToggle />
          <div>
            <p className={`text-[10px] uppercase tracking-widest m-0 ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>
              Question
            </p>
            <p className="text-xl font-bold m-0">{questionNumber || 0} / {questionCount}</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-widest m-0 ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>
              Accuracy
            </p>
            <p className="text-xl font-bold m-0">{totalGuesses > 0 ? Math.round((rightGuesses/totalGuesses)*100) : 0}%</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-widest m-0 ${isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"}`}>
              Score
            </p>
            <p className={`text-xl font-bold m-0 ${isLight ? "text-[#000522]" : "text-[#F2EBD1]"}`}>{score}</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center pt-20">
        
        {/* The Card Pack (Decks the cards) */}
        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 z-10" style={{ transform: "scale(0.55)" }}>
           <CardPack mode={endlessModeConfig} isOpen={true} />
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
          {!showLoadingCards && food && (
            <motion.div
              key={`photo-${questionNumber}`}
              initial={{ y: -100, opacity: 0, rotateZ: -5, scale: 0.5 }}
              animate={
                enlargedCard === 'photo' 
                ? { y: "-50%", x: "-50%", top: "50%", left: "50%", rotateZ: 0, scale: 1.5, zIndex: 100, opacity: 1 }
                : { y: 0, x: "-50%", top: "5%", left: "20%", rotateZ: -3, scale: 0.65, opacity: (answerResult && !enlargedCard) ? 0.2 : (enlargedCard ? 0 : 1), zIndex: 20 }
              }
              onClick={() => enlargedCard !== 'photo' && setEnlargedCard('photo')}
              exit={{ y: -100, opacity: 0, rotateZ: -5, scale: 0.5 }}
              className={`absolute z-20 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-[#254174]/50 flex items-center justify-center pointer-events-auto cursor-pointer transition-opacity duration-500 ${
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
                 {food.imageUrl ? (
                   <img src={food.imageUrl} alt="Food" onLoad={handleImageLoad} className="w-full h-full object-contain rounded-md" />
                 ) : (
                   <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No Image</div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ingredients Card (Right) */}
        <AnimatePresence mode="wait">
          {!showLoadingCards && food && (
            <motion.div
              key={`ingredients-${questionNumber}`}
              initial={{ y: -100, opacity: 0, rotateZ: 5, scale: 0.5 }}
              animate={
                enlargedCard === 'ingredients'
                ? { y: "-50%", x: "50%", top: "50%", right: "50%", rotateZ: 0, scale: 1.5, zIndex: 100, opacity: 1 }
                : { y: 0, x: "50%", top: "5%", right: "20%", rotateZ: 3, scale: 0.65, opacity: (answerResult && !enlargedCard) ? 0.2 : (enlargedCard ? 0 : 1), zIndex: 20 }
              }
              onClick={() => enlargedCard !== 'ingredients' && setEnlargedCard('ingredients')}
              exit={{ y: -100, opacity: 0, rotateZ: 5, scale: 0.5 }}
              className={`absolute z-20 w-[340px] h-[480px] rounded-[2rem] shadow-2xl overflow-hidden border-4 border-[#254174]/50 flex flex-col pointer-events-auto cursor-pointer transition-opacity duration-500 ${
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
                    <span className={`text-sm font-black ${isLight ? "text-[#F2EBD1]" : "text-[#254174]"}`}>♠</span>
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
        <div className={`absolute top-[42%] text-center z-20 px-8 w-full transition-opacity duration-500 pointer-events-none ${(showLoadingCards || answerResult) ? 'opacity-0' : 'opacity-100'}`}>
           <h1 
             className={`text-5xl font-bold mb-2 drop-shadow-md leading-tight ${
               isLight ? "text-[#000522]" : "text-[#F2EBD1]"
             }`} 
             style={{ fontFamily: '"Playfair Display", serif' }}
           >
             {food?.name || "..."}
           </h1>
           <p className={`font-bold text-lg uppercase tracking-widest mt-2 ${
             isLight ? "text-[#000522]/70" : "text-[#F2EBD1]/70"
           }`}>
             {food?.brand}
           </p>
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
                    rotateZ: isSelected ? 0 : fanAngle, // Flatten out when selected
                    zIndex: (isSelected || isCorrect) && answerResult ? 50 : 30
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
                  <div className="absolute inset-0 bg-[#254174] rounded-3xl shadow-2xl border-[6px] border-[#254174]/50 p-2 flex items-center justify-center backface-hidden" style={{ transform: "rotateY(180deg)" }}>
                     <div className="w-full h-full border border-[#254174]/50/50 rounded-sm flex flex-col items-center justify-center text-center p-2">
                       {loading ? (
                         <h2 className="text-[#F2EBD1] font-black text-7xl tracking-widest">{textContent}</h2>
                       ) : (
                         <>
                           <span className="text-[#F2EBD1] text-5xl mb-4 drop-shadow-[0_0_10px_rgba(242,235,209,0.5)]">♠</span>
                           <h2 className="text-[#F2EBD1] font-bold text-2xl mb-1">{textContent}</h2>
                           <p className="text-[#F2EBD1]/90 text-[10px] font-bold uppercase tracking-[0.2em] px-2 leading-tight">{descContent}</p>
                         </>
                       )}
                     </div>
                  </div>

                  {/* FRONT OF CARD (White/Navy Side - Visible after guessing) */}
                  <div className={`absolute inset-0 rounded-3xl shadow-2xl border-[6px] p-4 flex flex-col items-center justify-start text-center backface-hidden overflow-hidden ${
                    isCorrect ? 'border-green-500' : isWrongGuess ? 'border-red-500' : 'border-[#254174]/50'
                  } ${
                    isLight ? 'bg-[#0B1B42]' : 'bg-[#F2EBD1]'
                  }`}>
                     <h3 className={`text-xl font-black mt-2 mb-2 tracking-widest ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                       {isCorrect ? 'CORRECT' : 'YOUR GUESS'}
                     </h3>
                     <div className={`w-full h-[2px] mb-2 shrink-0 ${isLight ? 'bg-[#F2EBD1]/20' : 'bg-[#000522]/10'}`} />
                     <p className={`font-black text-2xl mb-1 shrink-0 ${isLight ? 'text-[#F2EBD1]' : 'text-[#000522]'}`}>
                       Tier {nova.level}
                     </p>
                     
                     {(food?.explanationText || answerResult?.explanationText) && (
                       <div className="flex-1 w-full mt-2 overflow-y-auto text-left border-t-2 border-[#254174]/50 pt-2 custom-scrollbar">
                         <p className={`text-[15px] leading-relaxed font-bold pb-2 ${isLight ? 'text-[#F2EBD1]/90' : 'text-[#000522]/80'}`}>
                           {food?.explanationText || answerResult?.explanationText}
                         </p>
                       </div>
                     )}
                  </div>

                  {/* Selected Indicator Glow */}
                  {isSelected && !answerResult && !loading && (
                    <div className="absolute -inset-4 bg-[#F2EBD1]/30 rounded-2xl blur-xl -z-10" />
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
                className="px-12 py-5 bg-[#254174] text-[#F2EBD1] font-black tracking-[4px] text-lg uppercase hover:scale-105 transition-transform rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              >
                {totalGuesses >= questionCount ? 'View Results' : 'Next Question →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Game Over Modal */}
      {showModal && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl border-4 border-[#254174]/50 transition-colors ${
              isLight ? 'bg-[#E5DEC3] text-[#000522]' : 'bg-[#F2EBD1] text-[#000522]'
            }`}
          >
            <h2 className="text-5xl font-bold mb-6 text-[#000522]" style={{ fontFamily: '"Playfair Display", serif' }}>
              Game Over!
            </h2>
            <div className="space-y-4 mb-8 text-lg font-bold">
              <p className="flex justify-between border-b border-[#254174]/40 pb-2">
                <span className="text-[#000522]/60 uppercase tracking-widest text-sm">Questions Played</span> 
                <span>{totalGuesses}</span>
              </p>
              <p className="flex justify-between border-b border-[#254174]/40 pb-2">
                <span className="text-[#000522]/60 uppercase tracking-widest text-sm">Right Guesses</span> 
                <span className="text-green-600">{rightGuesses}</span>
              </p>
              <p className="flex justify-between border-b border-[#254174]/40 pb-2">
                <span className="text-[#000522]/60 uppercase tracking-widest text-sm">Session Score</span> 
                <span className="text-[#254174]">{score}</span>
              </p>
              <p className="flex justify-between pb-2">
                <span className="text-[#000522]/60 uppercase tracking-widest text-sm">Accuracy</span> 
                <span>{totalGuesses > 0 ? Math.round((rightGuesses / totalGuesses) * 100) : 0}%</span>
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={startGame} 
                className="flex-1 py-4 bg-[#254174] text-[#F2EBD1] font-bold tracking-widest uppercase hover:bg-[#000522] transition-colors rounded-xl shadow-md"
              >
                Play Again
              </button>
              <button 
                onClick={() => { refreshUser(); navigate('/dashboard'); }} 
                className="flex-1 py-4 bg-transparent border-2 border-[#254174] text-[#000522] font-bold tracking-widest uppercase hover:bg-[#254174] hover:text-[#F2EBD1] transition-colors rounded-xl"
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