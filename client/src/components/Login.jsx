import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
    <div className="flex flex-col items-center w-full mt-4">
      {error && <p className="text-red-500 text-sm w-full text-center font-bold mb-2">{error}</p>}
      <div className="w-full border border-black/10 rounded overflow-hidden">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() => setError('Google login failed')}
          useOneTap
          shape="rectangular"
          size="large"
          width="100%"
        />
      </div>
    </div>
  );
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
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

  return (
    <div className="min-h-screen bg-[#d4d4d4] flex items-center justify-center p-4">
      <div className="bg-[#f4efe8] w-full max-w-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[12px] border-white p-10 flex flex-col items-center relative overflow-hidden">
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[#d11124]"></div>
        
        <span className="text-black text-4xl mb-4" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>♠</span>
        <h2 className="text-4xl font-black mb-8 text-[#1a1a1a] tracking-widest text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
          LOGIN
        </h2>
        
        {error && <p className="text-[#d11124] text-sm font-bold text-center mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="USERNAME"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="w-full bg-white border-2 border-black/10 px-4 py-4 rounded-xl text-black font-bold uppercase tracking-widest focus:outline-none focus:border-[#d11124] transition-colors"
          />
          <input 
            type="password" 
            placeholder="PASSWORD"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full bg-white border-2 border-black/10 px-4 py-4 rounded-xl text-black font-bold uppercase tracking-widest focus:outline-none focus:border-[#d11124] transition-colors"
          />
          <button type="submit" className="w-full mt-4 bg-[#1a1a1a] text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-[#d11124] transition-colors shadow-lg">
            Deal Me In
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-black/10"></div>
          <span className="text-neutral-400 font-bold uppercase tracking-widest text-xs">or</span>
          <div className="flex-1 h-px bg-black/10"></div>
        </div>

        <GoogleButton />

        <p className="mt-8 text-neutral-500 font-bold uppercase tracking-widest text-xs text-center">
          New player? <Link to="/register" className="text-[#d11124] hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
