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
      <div className="w-full border border-slate-100 rounded overflow-hidden">
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
    <div className="min-h-screen bg-[#000522] flex items-center justify-center p-4">
      <div className="bg-[#0B1B42] w-full max-w-md rounded-3xl border border-[#254174]/50 shadow-[0_0_80px_rgba(37,65,116,0.5)] p-10 flex flex-col items-center relative overflow-hidden">
        {/* Back Link */}
        <Link to="/" className="absolute top-6 left-6 text-[#F2EBD1]/60 hover:text-[#F2EBD1] transition-colors flex items-center gap-2 text-sm font-bold">
          ← Back
        </Link>
        

        
        <span className="text-[#F2EBD1] text-5xl mb-4 drop-shadow-[0_0_15px_rgba(242,235,209,0.8)]">♠</span>
        <h2 className="text-4xl font-black mb-8 text-[#F2EBD1] tracking-widest text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
          Welcome Back
        </h2>
        
        {error && <p className="text-[#F2EBD1] text-sm font-bold text-center mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="USERNAME"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="w-full bg-[#000522] border border-[#254174]/50 text-[#F2EBD1] placeholder-[#254174] px-4 py-4 rounded-2xl text-[#F2EBD1] font-bold uppercase tracking-widest focus:outline-none focus:border-[#254174] focus:ring-1 focus:ring-[#254174] transition-colors"
          />
          <input 
            type="password" 
            placeholder="PASSWORD"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full bg-[#000522] border border-[#254174]/50 text-[#F2EBD1] placeholder-[#254174] px-4 py-4 rounded-2xl text-[#F2EBD1] font-bold uppercase tracking-widest focus:outline-none focus:border-[#254174] focus:ring-1 focus:ring-[#254174] transition-colors"
          />
          <button type="submit" className="w-full mt-4 bg-[#254174] text-[#F2EBD1] text-[#F2EBD1] py-4 rounded-2xl font-bold hover:bg-[#000522] transition-colors shadow-lg">
            Deal Me In
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[#000522]/10"></div>
          <span className="text-neutral-400 font-bold uppercase tracking-widest text-xs">or</span>
          <div className="flex-1 h-px bg-[#000522]/10"></div>
        </div>

        <GoogleButton />

        <p className="mt-8 text-[#F2EBD1]/60 font-bold uppercase tracking-widest text-xs text-center">
          New player? <Link to="/register" className="text-[#F2EBD1] hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
