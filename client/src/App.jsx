import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import csvData from '../../data/processed/game_products.csv?raw';
import './index.css';

const NOVA_LEVELS = [
  { level: 1, title: 'Tier 1', desc: 'Not Processed / Minimally Processed' },
  { level: 2, title: 'Tier 2', desc: 'Processed Culinary Ingredients' },
  { level: 3, title: 'Tier 3', desc: 'Processed Foods' },
  { level: 4, title: 'Tier 4', desc: 'Highly Processed Foods' },
];

function App() {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [rightGuesses, setRightGuesses] = useState(0);
  
  const [selectedNova, setSelectedNova] = useState(null); // Which card the user clicked
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Parse CSV
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    let validProducts = parsed.data.filter(p => p.display_name && p.nova_group);
    
    // Shuffle array for random order
    for (let i = validProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validProducts[i], validProducts[j]] = [validProducts[j], validProducts[i]];
    }
    
    setProducts(validProducts);
  }, []);

  const currentProduct = products[currentIndex];

  const handleCardClick = (level) => {
    if (selectedNova !== null) return; // Prevent multiple clicks on the same question
    
    setSelectedNova(level);
    setTotalGuesses(prev => prev + 1);
    
    if (level === parseInt(currentProduct.nova_group)) {
      setScore(prev => prev + 10);
      setRightGuesses(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedNova(null);
    setCurrentIndex(prev => prev + 1);
  };

  const handleStop = () => {
    setShowModal(true);
  };

  const handleRestart = () => {
    // Reshuffle products
    const shuffled = [...products];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setProducts(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setTotalGuesses(0);
    setRightGuesses(0);
    setSelectedNova(null);
    setShowModal(false);
  };

  if (!products.length) return <div style={{padding: '20px'}}>Loading data...</div>;

  const isGameOver = currentIndex >= products.length || showModal;

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="controls">
          <button onClick={handleStop} className="btn-stop">Stop Game</button>
          <button onClick={handleRestart} className="btn-restart">Restart Game</button>
        </div>
        <div className="score-board">
          <p>Score: {score}</p>
          <p>Right Guesses: {rightGuesses}</p>
          <p>Total Guesses: {totalGuesses}</p>
        </div>
      </div>

      {/* Main Content */}
      {!isGameOver && (
        <div className="game-area">
          <h1 className="product-title">{currentProduct.display_name}</h1>
          <p className="product-brand">{currentProduct.brands}</p>

          <div className="cards-container">
            {NOVA_LEVELS.map(nova => {
              const isSelected = selectedNova === nova.level;
              const isCorrect = selectedNova !== null && nova.level === parseInt(currentProduct.nova_group);
              const isWrongGuess = isSelected && !isCorrect;
              
              let cardClass = "flip-card ";
              if (selectedNova !== null) {
                // Flip the card the user selected
                if (isSelected) {
                   cardClass += "flipped ";
                   cardClass += isWrongGuess ? "border-red " : "border-green ";
                } 
                // Also flip the correct card if they guessed wrong, to show them the right answer!
                else if (isCorrect) {
                   cardClass += "flipped border-green ";
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
                      {(isSelected || isCorrect) && (
                        <>
                          <h3 style={{fontSize: '1rem', margin: '5px 0', color: isCorrect ? '#15803d' : '#b91c1c'}}>
                            {isCorrect ? "Correct Answer!" : "Your Guess"}
                          </h3>
                          <hr style={{width: '100%', borderColor: '#eee'}} />
                          <p style={{margin: '5px 0', fontWeight: 'bold'}}>
                            Actual Tier: {currentProduct.nova_group}
                          </p>
                          <p className="ingredient-text">
                            <strong>Ingredients:</strong> {currentProduct.ingredients_text}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedNova !== null && (
            <div className="next-container">
              <button onClick={handleNext} className="btn-next">Next Question &rarr;</button>
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
              <p><strong>Total Questions Played:</strong> {totalGuesses}</p>
              <p><strong>Right Guesses:</strong> {rightGuesses}</p>
              <p><strong>Final Score:</strong> {score}</p>
              <p><strong>Accuracy:</strong> {totalGuesses > 0 ? Math.round((rightGuesses / totalGuesses) * 100) : 0}%</p>
            </div>
            <button onClick={handleRestart} className="btn-restart large">Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
