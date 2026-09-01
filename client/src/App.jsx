import { useState } from 'react';

// Temporary dummy card data for Week 2
const TEMPORARY_CARDS = [
  { id: 1, name: 'Apple', ingredients: 'Apple', novaLevel: 1 },
  { id: 2, name: 'Potato Chips', ingredients: 'Potatoes, Vegetable Oil, Salt', novaLevel: 4 },
  { id: 3, name: 'Canned Beans', ingredients: 'Beans, Water, Salt', novaLevel: 3 },
  { id: 4, name: 'White Bread', ingredients: 'Flour, Water, Yeast, Salt', novaLevel: 3 },
  { id: 5, name: 'Soda', ingredients: 'Carbonated Water, High Fructose Corn Syrup, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine', novaLevel: 4 },
  { id: 6, name: 'Milk', ingredients: 'Milk', novaLevel: 1 },
  { id: 7, name: 'Salted Butter', ingredients: 'Cream, Salt', novaLevel: 2 },
  { id: 8, name: 'Instant Noodles', ingredients: 'Wheat Flour, Palm Oil, Salt, MSG, Flavor Enhancers', novaLevel: 4 },
  { id: 9, name: 'Olive Oil', ingredients: 'Olive Oil', novaLevel: 2 },
  { id: 10, name: 'Frozen Pizza', ingredients: 'Crust (Flour, Water, Yeast), Tomato Sauce, Cheese, Pepperoni (Pork, Beef, Salt, Spices, Nitrites)', novaLevel: 4 },
];

const NOVA_LEVELS = [
  { level: 1, label: 'NOVA 1 (Unprocessed/Minimally Processed)' },
  { level: 2, label: 'NOVA 2 (Processed Culinary Ingredients)' },
  { level: 3, label: 'NOVA 3 (Processed Foods)' },
  { level: 4, label: 'NOVA 4 (Ultra-Processed Foods)' },
];

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const currentCard = TEMPORARY_CARDS[currentQuestionIndex];

  const handleAnswer = (selectedLevel) => {
    // Check answer
    if (selectedLevel === currentCard.novaLevel) {
      setScore(score + 1);
    }

    // Move to next question or end game
    if (currentQuestionIndex < TEMPORARY_CARDS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameOver(true);
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <div style={styles.container}>
        <h2>Game Over!</h2>
        <p>Your final score: {score} out of {TEMPORARY_CARDS.length}</p>
        <button onClick={restartGame} style={styles.button}>Play Again</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>IngredientIQ</h2>
        <div style={styles.scoreBoard}>
          Score: {score} | Question: {currentQuestionIndex + 1}/10
        </div>
      </header>

      <main style={styles.card}>
        <h3 style={styles.foodName}>{currentCard.name}</h3>
        <p style={styles.ingredients}><strong>Ingredients:</strong> {currentCard.ingredients}</p>
      </main>

      <div style={styles.buttonContainer}>
        {NOVA_LEVELS.map((nova) => (
          <button 
            key={nova.level} 
            onClick={() => handleAnswer(nova.level)}
            style={styles.button}
          >
            {nova.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px'
  },
  scoreBoard: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#555'
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '20px',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  foodName: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    color: '#111827'
  },
  ingredients: {
    margin: 0,
    color: '#4b5563',
    fontSize: '16px',
    fontStyle: 'italic'
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default App;
