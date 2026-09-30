import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../index.css';

const API_BASE = '/api/daily';

const NOVA_LEVELS = [
  { level: 1, title: 'Tier 1', desc: 'Not Processed / Minimally Processed' },
  { level: 2, title: 'Tier 2', desc: 'Processed Culinary Ingredients' },
  { level: 3, title: 'Tier 3', desc: 'Processed Foods' },
  { level: 4, title: 'Tier 4', desc: 'Highly Processed Foods' },
];

function DailyChallenge() {
  const { token, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  const [foods, setFoods] = useState([]);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [scorePopup, setScorePopup] = useState(null);
  
  // Temporary state for the current answer animation before moving to next question
  const [answerResult, setAnswerResult] = useState(null); 
  const [selectedNova, setSelectedNova] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(null);

  const fetchDailyChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch daily challenge');
      
      setFoods(data.foods);
      
      // Find first unanswered question
      const nextIndex = data.foods.findIndex(f => f.status === 'unanswered');
      setCurrentFoodIndex(nextIndex); // will be -1 if all answered
      setQuestionStartedAt(Date.now());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load daily challenge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchDailyChallenge();
  }, []);

  const handleCardClick = async (level) => {
    if (selectedNova !== null || submitting || currentFoodIndex === -1) return;
    const currentFood = foods[currentFoodIndex];

    setSelectedNova(level);
    setSubmitting(true);
    setError(null);

    const responseTimeMs = questionStartedAt ? Math.max(0, Date.now() - questionStartedAt) : 0;

    try {
      const res = await fetch(`${API_BASE}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          foodId: currentFood._id,
          guessedLevel: level,
          responseTimeMs
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit answer');

      setAnswerResult(data);
      if (data.pointsChange !== undefined) {
        setScorePopup({ value: data.pointsChange, id: Date.now().toString() });
      }

    } catch (err) {
      console.error(err);
      setSelectedNova(null);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    // Reset local state and move to next question
    setSelectedNova(null);
    setAnswerResult(null);
    setScorePopup(null);
    setQuestionStartedAt(Date.now());
    
    // Update local foods array to mark current as answered
    const updatedFoods = [...foods];
    updatedFoods[currentFoodIndex].status = answerResult.isCorrect ? 'correct' : 'incorrect';
    setFoods(updatedFoods);

    const nextIndex = updatedFoods.findIndex(f => f.status === 'unanswered');
    setCurrentFoodIndex(nextIndex);
    
    if (nextIndex === -1) {
      refreshUser(); // Sync final points if completed
    }
  };

  const goDashboard = () => navigate('/dashboard');

  if (loading) {
    return <div className="app-container"><h2 style={{textAlign: 'center', marginTop: '50px'}}>Loading Daily Challenge...</h2></div>;
  }

  // Lockout Screen
  if (currentFoodIndex === -1 && !error) {
    const correctCount = foods.filter(f => f.status === 'correct').length;
    return (
      <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="modal-content" style={{animation: 'scaleIn 0.5s ease-out'}}>
          <h1 style={{fontSize: '3rem', margin: '0 0 20px 0'}}>🎉 5/5</h1>
          <h2>Daily Challenge Completed!</h2>
          <p style={{fontSize: '1.2rem', color: '#4b5563', margin: '20px 0'}}>
            You got <strong>{correctCount}</strong> out of 5 correct today.
          </p>
          <div style={{background: '#f3f4f6', padding: '15px', borderRadius: '12px', marginBottom: '30px'}}>
            <h3 style={{margin: '0 0 10px 0'}}>Come back tomorrow!</h3>
            <p style={{margin: 0, fontSize: '0.9rem'}}>New foods will be available at midnight.</p>
          </div>
          <button onClick={goDashboard} className="btn-primary large">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentFood = foods[currentFoodIndex];
  const actualLevel = answerResult?.actualLevel;

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="controls">
          <button onClick={goDashboard} className="btn-logout">← Back</button>
        </div>
        <div className="score-board">
          <p>Daily Progress: {currentFoodIndex + 1} / 5</p>
        </div>
      </div>

      <div className="game-area" style={{ position: 'relative' }}>
        {scorePopup && (
          <div key={scorePopup.id} className={`score-popup ${scorePopup.value > 0 ? 'positive' : scorePopup.value < 0 ? 'negative' : 'neutral'}`}>
            {scorePopup.value > 0 ? '+' : ''}{scorePopup.value}
          </div>
        )}

        <h2 style={{color: '#3b82f6', marginBottom: '0'}}>Daily Challenge</h2>
        <h1 className="product-title">{currentFood?.name}</h1>
        <p className="product-brand">{currentFood?.brand}</p>

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
              {currentFoodIndex === 4 ? 'View Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyChallenge;
