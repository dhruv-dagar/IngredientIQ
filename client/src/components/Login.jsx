import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    // googleResponse contains access_token, but our backend expects idToken.
    // wait, @react-oauth/google `useGoogleLogin` returns an access_token. 
    // To get an ID token we should use the GoogleLogin component OR set flow: 'auth-code'.
    // Actually, it's easier to use the GoogleLogin component directly, or use useGoogleLogin with credential flow.
    // Let's use the explicit `useGoogleLogin` but fetch user info? No, backend needs ID token.
    console.log("Google success, wait for component update");
  };

  // Wait, let's use the <GoogleLogin /> component from @react-oauth/google instead of the hook for easy ID token.
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary">Login</button>
        </form>

        <div className="divider">or</div>

        <GoogleButton />

        <p className="auth-link">
          Don't have an account? <Link to="/register" style={{color: '#3b82f6', fontWeight: 'bold'}}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

// Separate component to handle GoogleLogin so we can import it
import { GoogleLogin } from '@react-oauth/google';
function GoogleButton() {
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSuccess = async (credentialResponse) => {
    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Google login failed');
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
      {error && <p className="error-msg" style={{width: '100%', fontSize: '0.9rem'}}>{error}</p>}
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => setError('Google login failed')}
        useOneTap
        shape="rectangular"
        size="large"
        width="100%"
      />
    </div>
  );
}

export default Login;
