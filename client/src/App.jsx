import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { StreakNotificationProvider } from './context/StreakNotificationContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useContext } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import GameDashboard from './components/game/game-dashboard';
import Game from './components/Game';
import DailyChallenge from './components/DailyChallenge';
import TimeAttack from './components/TimeAttack';
import Footer from './components/ui/Footer';
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
        <ThemeProvider>
          <StreakNotificationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Landing />} />
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
                <Route 
                  path="/time-attack" 
                  element={<ProtectedRoute><TimeAttack /></ProtectedRoute>} 
                />
              </Routes>
              <Footer />
            </Router>
          </StreakNotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
