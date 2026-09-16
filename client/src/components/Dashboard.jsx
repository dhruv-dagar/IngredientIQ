import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const getBadge = (level) => {
  if (level === 1) return { icon: '🌱', title: 'Novice' };
  if (level === 2) return { icon: '🍳', title: 'Apprentice' };
  if (level === 3) return { icon: '👨‍🍳', title: 'Expert' };
  return { icon: '👑', title: 'Master' };
};

function Dashboard() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Refresh user data when dashboard loads to ensure points are up to date
  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div style={{padding: '20px'}}>Loading...</div>;

  const badge = getBadge(user.level);
  
  // Calculate progress to next level (200 points per level)
  const currentPointsInLevel = user.totalPoints % 200;
  const progressPercentage = (currentPointsInLevel / 200) * 100;
  const pointsToNext = 200 - currentPointsInLevel;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>

      <div className="badge-container">
        <div className="badge-icon">{badge.icon}</div>
        <div className="badge-title">{badge.title}</div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Points</h3>
          <p className="stat-value">{user.totalPoints}</p>
        </div>
        <div className="stat-card">
          <h3>Current Level</h3>
          <p className="stat-value">{user.level}</p>
        </div>
      </div>

      <div className="progress-container">
        <h3>Level Progress</h3>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text">
          <span>{currentPointsInLevel} / 200</span>
          <span>{pointsToNext} points to next level</span>
        </div>
      </div>

      <div className="dashboard-actions" style={{marginTop: '40px'}}>
        <button onClick={() => navigate('/game')} className="btn-primary large">
          Play Game
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
