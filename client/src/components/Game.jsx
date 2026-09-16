import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../index.css';

const API_BASE = '/api/game';

const NOVA_LEVELS = [
  { level: 1, title: 'Tier 1', desc: 'Not Processed / Minimally Processed' },
  { level: 2, title: 'Tier 2', desc: 'Processed Culinary Ingredients' },
  { level: 3, title: 'Tier 3', desc: 'Processed Foods' },
  { level: 4, title: 'Tier 4', desc: 'Highly Processed Foods' },
];

function Game() {
  const { token, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const hasStartedRef = useRef(false);

  const [sessionId, setSessionId] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);

  const [selectedNova, setSelectedNova] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [scorePopup, setScorePopup] = useState(null); // { value: number, id: string }

  const [score, setScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [rightGuesses, setRightGuesses] = useState(0);

  const [questionStartedAt, setQuestionStartedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const startGame = async () => {
    try {
      setLoading(true);
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
    }
  };

  const fetchQuestion = async (activeSessionId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedNova(null);
      setAnswerResult(null);
      setScorePopup(null);

      const response = await fetch(`${API_BASE}/questions?sessionId=${encodeURIComponent(activeSessionId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get question');

      setCurrentQuestion(data.food);
      setQuestionNumber(data.questionNumber);
      setQuestionStartedAt(Date.now());
    } catch (err) {
      console.error('Fetch question error:', err);
      setError(err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (level) => {
    if (selectedNova !== null || submitting || !currentQuestion || !sessionId) return;

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
        setScore((prev) => prev + 10); // Local session score
      }

      // Show animated score popup
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

  const handleStop = () => {
    finishGame();
  };

  const finishGame = () => {
    setShowModal(true);
    refreshUser(); // Sync points to dashboard when returning
  };

  const handleRestart = async () => {
    await startGame();
  };

  const goDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startGame();
  }, []);

  const isGameOver = showModal;

  if (loading && !currentQuestion) {
    return (
      <div className="app-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Loading game...</h2>
          {error && (
            <>
              <p>{error}</p>
              <button onClick={startGame} className="btn-restart">Try Again</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="app-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Unable to load game</h2>
          <p>{error}</p>
          <button onClick={startGame} className="btn-restart">Try Again</button>
          <button onClick={goDashboard} className="btn-stop" style={{marginLeft: '10px'}}>Dashboard</button>
        </div>
      </div>
    );
  }

  const food = currentQuestion?.food || currentQuestion;
  const actualLevel = answerResult?.actualLevel;

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="controls">
          <button onClick={handleStop} className="btn-stop" disabled={isGameOver}>Stop Game</button>
          <button onClick={handleRestart} className="btn-restart">Restart Game</button>
        </div>

        <div className="score-board">
          <p>Session Score: {score}</p>
          <p>Right Guesses: {rightGuesses}</p>
          <p>Total Guesses: {totalGuesses}</p>
        </div>
      </div>

      {/* Main Content */}
      {!isGameOver && food && (
        <div className="game-area" style={{ position: 'relative' }}>
          
          {scorePopup && (
            <div key={scorePopup.id} className={`score-popup ${scorePopup.value > 0 ? 'positive' : scorePopup.value < 0 ? 'negative' : 'neutral'}`}>
              {scorePopup.value > 0 ? '+' : ''}{scorePopup.value}
            </div>
          )}

          <h1 className="product-title">{food.name}</h1>
          <p className="product-brand">{food.brand}</p>

          {error && <p style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</p>}

          <div className="cards-container">
            {NOVA_LEVELS.map((nova) => {
              const isSelected = selectedNova === nova.level;
              const isCorrect = answerResult && nova.level === Number(actualLevel);
              const isWrongGuess = isSelected && !isCorrect;

              let cardClass = 'flip-card ';
              if (answerResult) {
                if (isSelected) {
                  cardClass += 'flipped ' + (isWrongGuess ? 'border-red ' : 'border-green ');
                } else if (isCorrect) {
                  cardClass += 'flipped border-green ';
                }
              }

              return (
                <div key={nova.level} className={cardClass} onClick={() => handleCardClick(nova.level)}>
                  <div className="flip-card-inner">
                    <div className="flip-card-front">
                      <h2>{nova.title}</h2>
                      <p>{nova.desc}</p>
                    </div>
                    <div className="flip-card-back">
                      {(isSelected || isCorrect) && answerResult && (
                        <>
                          <h3 style={{ fontSize: '1rem', margin: '5px 0', color: isCorrect ? '#15803d' : '#b91c1c' }}>
                            {isCorrect ? 'Correct Answer!' : 'Your Guess'}
                          </h3>
                          <hr style={{ width: '100%', borderColor: '#eee' }} />
                          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Actual Tier: {answerResult.actualLevel}</p>
                          <p className="ingredient-text"><strong>Ingredients:</strong> {answerResult.ingredientsText}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {answerResult && (
            <div className="next-container">
              <button onClick={handleNext} className="btn-next" disabled={submitting}>
                {totalGuesses >= questionCount ? 'View Results' : 'Next Question →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal / Scorecard */}
      {isGameOver && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Game Over!</h2>
            <div className="final-stats">
              <p><strong>Questions Played:</strong> {totalGuesses}</p>
              <p><strong>Right Guesses:</strong> {rightGuesses}</p>
              <p><strong>Session Score:</strong> {score}</p>
              <p><strong>Accuracy:</strong> {totalGuesses > 0 ? Math.round((rightGuesses / totalGuesses) * 100) : 0}%</p>
            </div>
            <button onClick={handleRestart} className="btn-restart large" style={{marginBottom: '10px'}}>Play Again</button>
            <button onClick={goDashboard} className="btn-stop large" style={{width: '100%', padding: '15px', fontSize: '1.2rem'}}>Back to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;