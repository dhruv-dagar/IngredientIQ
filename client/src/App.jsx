import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useContext } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import GameDashboard from './components/game/game-dashboard';
import Game from './components/Game';
import DailyChallenge from './components/DailyChallenge';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute><GameDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/game" 
              element={<ProtectedRoute><Game /></ProtectedRoute>} 
            />
            <Route 
              path="/daily" 
              element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
