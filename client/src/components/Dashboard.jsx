import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; // Or a loading spinner

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Points</h3>
          <p className="stat-value">{user.totalPoints || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Current Level</h3>
          <p className="stat-value">{user.level || 1}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={() => navigate('/game')} className="btn-primary large">
          Play Game
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
