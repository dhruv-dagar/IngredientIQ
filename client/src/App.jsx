import { useEffect, useRef, useState } from 'react';
import './index.css';

const API_BASE = '/api/game';

const NOVA_LEVELS = [
  {
    level: 1,
    title: 'Tier 1',
    desc: 'Not Processed / Minimally Processed',
  },
  {
    level: 2,
    title: 'Tier 2',
    desc: 'Processed Culinary Ingredients',
  },
  {
    level: 3,
    title: 'Tier 3',
    desc: 'Processed Foods',
  },
  {
    level: 4,
    title: 'Tier 4',
    desc: 'Highly Processed Foods',
  },
];

function App() {
  const hasStartedRef = useRef(false);

  const [sessionId, setSessionId] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);

  const [selectedNova, setSelectedNova] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);

  const [score, setScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [rightGuesses, setRightGuesses] = useState(0);

  const [questionStartedAt, setQuestionStartedAt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);

  /*
   * Start a new backend game session.
   */
  const startGame = async () => {
    try {
      setLoading(true);
      setError(null);

      setSessionId(null);
      setCurrentQuestion(null);
      setQuestionNumber(0);
      setSelectedNova(null);
      setAnswerResult(null);

      setScore(0);
      setTotalGuesses(0);
      setRightGuesses(0);

      setShowModal(false);

      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create game session'
        );
      }

      setSessionId(data.sessionId);
      setQuestionCount(data.questionCount || 10);

      await fetchQuestion(data.sessionId);
    } catch (err) {
      console.error('Start game error:', err);
      setError(err.message || 'Failed to start game');
      setLoading(false);
    }
  };

  /*
   * Ask the backend for the next question.
   */
  const fetchQuestion = async (activeSessionId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedNova(null);
      setAnswerResult(null);

      const response = await fetch(
        `${API_BASE}/questions?sessionId=${encodeURIComponent(
          activeSessionId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to get question'
        );
      }

      setCurrentQuestion(data.food);
      setQuestionNumber(data.questionNumber);

      // Start response-time measurement.
      setQuestionStartedAt(Date.now());
    } catch (err) {
      console.error('Fetch question error:', err);
      setError(err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  /*
   * Submit the user's guess to the backend.
   *
   * The frontend does NOT determine whether the answer
   * is correct. The backend determines that.
   */
  const handleCardClick = async (level) => {
    if (
      selectedNova !== null ||
      submitting ||
      !currentQuestion ||
      !sessionId
    ) {
      return;
    }

    setSelectedNova(level);
    setSubmitting(true);
    setError(null);

    const responseTimeMs = questionStartedAt
      ? Math.max(0, Date.now() - questionStartedAt)
      : 0;

    try {
      const response = await fetch(`${API_BASE}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          foodId: currentQuestion._id,
          guessedLevel: level,
          responseTimeMs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to submit answer'
        );
      }

      setAnswerResult(data);

      setTotalGuesses((previous) => previous + 1);

      if (data.isCorrect) {
        setRightGuesses((previous) => previous + 1);
        setScore((previous) => previous + 10);
      }
    } catch (err) {
      console.error('Submit answer error:', err);
      setSelectedNova(null);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Move to the next question.
   */
  const handleNext = async () => {
    if (!sessionId || submitting) {
      return;
    }

    /*
     * Do not request question 11.
     */
    if (totalGuesses >= questionCount) {
      setShowModal(true);
      return;
    }

    await fetchQuestion(sessionId);
  };

  /*
   * Stop the current game and show the scorecard.
   */
  const handleStop = () => {
    setShowModal(true);
  };

  /*
   * Start a completely fresh backend session.
   */
  const handleRestart = async () => {
    await startGame();
  };

  /*
   * Start the first game when the component loads.
   */
  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    startGame();
  }, []);

  const isGameOver = showModal;

  /*
   * Loading screen.
   */
  if (loading && !currentQuestion) {
    return (
      <div className="app-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Loading game...</h2>

          {error && (
            <>
              <p>{error}</p>

              <button
                onClick={startGame}
                className="btn-restart"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /*
   * Error screen if a question could not be loaded.
   */
  if (error && !currentQuestion) {
    return (
      <div className="app-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Unable to load game</h2>
          <p>{error}</p>

          <button
            onClick={startGame}
            className="btn-restart"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * Current backend-provided food.
   */
  const food = currentQuestion?.food || currentQuestion;

  /*
   * Backend answer result.
   */
  const actualLevel = answerResult?.actualLevel;

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="controls">
          <button
            onClick={handleStop}
            className="btn-stop"
            disabled={isGameOver}
          >
            Stop Game
          </button>

          <button
            onClick={handleRestart}
            className="btn-restart"
          >
            Restart Game
          </button>
        </div>

        <div className="score-board">
          <p>Score: {score}</p>
          <p>Right Guesses: {rightGuesses}</p>
          <p>Total Guesses: {totalGuesses}</p>
        </div>
      </div>

      {/* Main Content */}
      {!isGameOver && food && (
        <div className="game-area">
          <h1 className="product-title">
            {food.name}
          </h1>

          <p className="product-brand">
            {food.brand}
          </p>

          {error && (
            <p
              style={{
                color: '#b91c1c',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <div className="cards-container">
            {NOVA_LEVELS.map((nova) => {
              const isSelected =
                selectedNova === nova.level;

              const isCorrect =
                answerResult &&
                nova.level === Number(actualLevel);

              const isWrongGuess =
                isSelected && !isCorrect;

              let cardClass = 'flip-card ';

              if (answerResult) {
                /*
                 * Flip the user's selected card.
                 */
                if (isSelected) {
                  cardClass += 'flipped ';

                  cardClass += isWrongGuess
                    ? 'border-red '
                    : 'border-green ';
                }

                /*
                 * If the user was wrong, also flip
                 * the actual correct card.
                 */
                else if (isCorrect) {
                  cardClass += 'flipped border-green ';
                }
              }

              return (
                <div
                  key={nova.level}
                  className={cardClass}
                  onClick={() =>
                    handleCardClick(nova.level)
                  }
                >
                  <div className="flip-card-inner">
                    {/* Front */}
                    <div className="flip-card-front">
                      <h2>{nova.title}</h2>
                      <p>{nova.desc}</p>
                    </div>

                    {/* Back */}
                    <div className="flip-card-back">
                      {(isSelected || isCorrect) &&
                        answerResult && (
                          <>
                            <h3
                              style={{
                                fontSize: '1rem',
                                margin: '5px 0',
                                color: isCorrect
                                  ? '#15803d'
                                  : '#b91c1c',
                              }}
                            >
                              {isCorrect
                                ? 'Correct Answer!'
                                : 'Your Guess'}
                            </h3>

                            <hr
                              style={{
                                width: '100%',
                                borderColor: '#eee',
                              }}
                            />

                            <p
                              style={{
                                margin: '5px 0',
                                fontWeight: 'bold',
                              }}
                            >
                              Actual Tier:{' '}
                              {answerResult.actualLevel}
                            </p>

                            <p className="ingredient-text">
                              <strong>
                                Ingredients:
                              </strong>{' '}
                              {answerResult.ingredientsText}
                            </p>
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
              <button
                onClick={handleNext}
                className="btn-next"
                disabled={submitting}
              >
                {totalGuesses >= questionCount
                  ? 'View Results'
                  : 'Next Question →'}
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
              <p>
                <strong>
                  Total Questions Played:
                </strong>{' '}
                {totalGuesses}
              </p>

              <p>
                <strong>Right Guesses:</strong>{' '}
                {rightGuesses}
              </p>

              <p>
                <strong>Final Score:</strong>{' '}
                {score}
              </p>

              <p>
                <strong>Accuracy:</strong>{' '}
                {totalGuesses > 0
                  ? Math.round(
                      (rightGuesses / totalGuesses) * 100
                    )
                  : 0}
                %
              </p>
            </div>

            <button
              onClick={handleRestart}
              className="btn-restart large"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;