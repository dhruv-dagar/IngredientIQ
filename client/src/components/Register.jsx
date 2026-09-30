import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    const result = await register(username, password);
    if (result.success) {
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  const onGoogleSuccess = async (credentialResponse) => {
    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Google registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Choose a Username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              minLength="3"
              maxLength="30"
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Create a Password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary">Register</button>
        </form>

        <div className="divider">or</div>

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => setError('Google registration failed')}
            shape="rectangular"
            size="large"
            width="100%"
            text="signup_with"
          />
        </div>

        <p className="auth-link">
          Already have an account? <Link to="/login" style={{color: '#3b82f6', fontWeight: 'bold'}}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
