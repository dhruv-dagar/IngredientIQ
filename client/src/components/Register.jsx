import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ui/ThemeToggle';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const { isLight } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 relative ${
      isLight ? "bg-[#F2EBD1]" : "bg-[#000522]"
    }`}>
      <div className={`w-full max-w-md rounded-3xl border p-10 flex flex-col items-center relative overflow-hidden transition-all duration-500 ${
        isLight
          ? "bg-[#E5DEC3] border-2 border-[#254174]/40 shadow-[0_0_80px_rgba(37,65,116,0.25)]"
          : "bg-[#0B1B42] border border-[#254174]/50 shadow-[0_0_80px_rgba(37,65,116,0.5)]"
      }`}>
        {/* Back Link */}
        <Link 
          to="/" 
          className={`absolute top-6 left-6 transition-colors flex items-center gap-2 text-sm font-bold ${
            isLight ? "text-[#000522]/60 hover:text-[#000522]" : "text-[#F2EBD1]/60 hover:text-[#F2EBD1]"
          }`}
        >
          ← Back
        </Link>
        
        {/* Theme Toggle inside the card at top right */}
        <div className="absolute top-5 right-5 z-20">
          <ThemeToggle />
        </div>
        
        <span className={`text-5xl mb-4 ${
          isLight ? "text-[#254174]" : "text-[#F2EBD1] drop-shadow-[0_0_15px_rgba(242,235,209,0.8)]"
        }`}>
          ♠
        </span>
        <h2 
          className={`text-4xl font-black mb-8 tracking-widest text-center ${
            isLight ? "text-[#000522]" : "text-[#F2EBD1]"
          }`} 
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Create Account
        </h2>
        
        {error && <p className="text-red-500 text-sm font-bold text-center mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="USERNAME"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className={`w-full px-4 py-4 rounded-2xl font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#254174] transition-colors border ${
              isLight
                ? "bg-[#F2EBD1] border-[#254174]/40 text-[#000522] placeholder-[#254174]/60 focus:border-[#254174]"
                : "bg-[#000522] border-[#254174]/50 text-[#F2EBD1] placeholder-[#254174] focus:border-[#254174]"
            }`}
          />
          <input 
            type="password" 
            placeholder="PASSWORD"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className={`w-full px-4 py-4 rounded-2xl font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#254174] transition-colors border ${
              isLight
                ? "bg-[#F2EBD1] border-[#254174]/40 text-[#000522] placeholder-[#254174]/60 focus:border-[#254174]"
                : "bg-[#000522] border-[#254174]/50 text-[#F2EBD1] placeholder-[#254174] focus:border-[#254174]"
            }`}
          />
          <input 
            type="password" 
            placeholder="CONFIRM PASSWORD"
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            className={`w-full px-4 py-4 rounded-2xl font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#254174] transition-colors border ${
              isLight
                ? "bg-[#F2EBD1] border-[#254174]/40 text-[#000522] placeholder-[#254174]/60 focus:border-[#254174]"
                : "bg-[#000522] border-[#254174]/50 text-[#F2EBD1] placeholder-[#254174] focus:border-[#254174]"
            }`}
          />
          <button 
            type="submit" 
            className="w-full mt-4 bg-[#254174] text-[#F2EBD1] py-4 rounded-2xl font-bold hover:bg-[#000522] transition-colors shadow-lg active:scale-95"
          >
            Create Account
          </button>
        </form>

        <p className={`mt-8 font-bold uppercase tracking-widest text-xs text-center ${
          isLight ? "text-[#000522]/60" : "text-[#F2EBD1]/60"
        }`}>
          Already a player?{" "}
          <Link to="/login" className={isLight ? "text-[#254174] hover:underline" : "text-[#F2EBD1] hover:underline"}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
