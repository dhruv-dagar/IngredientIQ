import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Landing() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handlePlay = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#000522] text-[#F2EBD1] font-sans selection:bg-[#254174] selection:text-[#F2EBD1] overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="w-full p-6 flex justify-between items-center fixed top-0 z-50 border-b border-[#254174]/30 bg-[#000522]/80 backdrop-blur-md">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2 text-[#F2EBD1]">
          Ingredient<span className="text-[#254174]">IQ</span>
        </div>
        <button 
          onClick={handlePlay}
          disabled={loading}
          className="px-6 py-2.5 bg-[#F2EBD1] text-[#000522] font-bold text-sm rounded-full hover:bg-[#254174] hover:text-[#F2EBD1] transition-colors shadow-lg active:scale-95 border border-[#F2EBD1]"
        >
          {loading ? '...' : user ? 'Dashboard' : 'Log In'}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-4 relative pt-20">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F2EBD1_1px,transparent_1px),linear-gradient(to_bottom,#F2EBD1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(0,0,0,0.05)_70%,transparent_100%)] pointer-events-none opacity-20"></div>
        
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#254174]/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-[#0B1B42]/50 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-4xl w-full flex flex-col items-center text-center z-10 relative">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-[#0B1B42]/80 text-[#F2EBD1] text-xs font-bold border border-[#254174]/50 cursor-default shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#F2EBD1] animate-pulse"></span>
            v2.0 Beta Live
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1.1] text-[#F2EBD1]">
            Analyze ingredients. <br/><span className="text-[#254174]">Master your health.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#F2EBD1]/70 mb-10 max-w-2xl leading-relaxed font-medium">
            The minimalist classification game. Read real-world food labels, predict their NOVA processing tier, and climb the global leaderboards.
          </p>

          <div className="flex gap-4">
            <button 
              onClick={handlePlay}
              disabled={loading}
              className="px-10 py-4 bg-[#254174] text-[#F2EBD1] font-bold text-lg rounded-full shadow-[0_0_30px_rgba(37,65,116,0.4)] transition-all duration-300 hover:bg-[#0B1B42] hover:border-[#254174] border border-transparent hover:-translate-y-1 active:scale-95"
            >
              Start Playing
            </button>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-32 bg-[#0B1B42] relative border-t border-[#254174]/30 z-20 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-[#F2EBD1]">
              How It Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Inspect', desc: 'Review the food product card. Check the brand and title.' },
              { step: '02', title: 'Analyze', desc: 'Flip to the ingredients. Read the raw list of what goes into making the product.' },
              { step: '03', title: 'Classify', desc: 'Make your decision. Place the food in one of the 4 NOVA Classification tiers.' }
            ].map((item, i) => (
              <div key={i} className="bg-[#000522] p-8 rounded-3xl border border-[#254174]/30 hover:border-[#254174] transition-all duration-500 group shadow-xl">
                <div className="text-sm font-bold text-[#254174] mb-8 bg-[#0B1B42] inline-block px-4 py-2 rounded-full">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3 text-[#F2EBD1]">{item.title}</h3>
                <p className="text-[#F2EBD1]/70 leading-relaxed text-base font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The NOVA System (Rules on each level) */}
      <section className="py-32 bg-[#000522] text-[#F2EBD1] relative border-t border-[#254174]/30 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-[#F2EBD1]">
              The NOVA Standard
            </h2>
            <p className="text-[#F2EBD1]/70 max-w-2xl text-lg font-medium">
              The definitive system for classifying foods by their level of industrial processing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { tier: 'Tier 1', name: 'Unprocessed', color: 'bg-green-500', desc: 'Natural foods altered only by removing inedible parts, drying, crushing, or boiling. (e.g., Fresh fruit, raw nuts, plain milk)' },
              { tier: 'Tier 2', name: 'Culinary Ingredients', color: 'bg-yellow-500', desc: 'Substances extracted directly from nature or Tier 1 foods to be used in cooking. (e.g., Olive oil, butter, sugar, salt)' },
              { tier: 'Tier 3', name: 'Processed Foods', color: 'bg-orange-500', desc: 'Products made by adding Tier 2 ingredients to Tier 1 foods, usually to increase durability. (e.g., Canned beans, fresh bread, cheese)' },
              { tier: 'Tier 4', name: 'Ultra-Processed', color: 'bg-red-500', desc: 'Industrial formulations containing 5+ ingredients, including additives like dyes, flavor enhancers, and preservatives. (e.g., Soda, candy)' }
            ].map((nova, i) => (
              <div key={i} className="bg-[#0B1B42] border border-[#254174]/30 p-8 rounded-3xl transition-all duration-300 hover:bg-[#254174]/20 group shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-3 h-3 rounded-full ${nova.color} shadow-[0_0_10px_currentColor]`}></div>
                  <h3 className="text-xl font-bold text-[#F2EBD1]">{nova.tier} <span className="text-[#F2EBD1]/50 font-normal">— {nova.name}</span></h3>
                </div>
                <p className="text-[#F2EBD1]/70 text-base leading-relaxed pl-7 font-medium">{nova.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 bg-[#0B1B42] border-t border-[#254174]/30 text-center rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
        <h2 className="text-4xl md:text-5xl font-black mb-10 tracking-tight text-[#F2EBD1]">
          Ready to begin?
        </h2>
        <button 
          onClick={handlePlay}
          disabled={loading}
          className="px-12 py-5 bg-[#F2EBD1] text-[#000522] font-black text-lg rounded-full hover:scale-105 hover:bg-[#254174] hover:text-[#F2EBD1] hover:shadow-[0_0_30px_rgba(37,65,116,0.6)] transition-all duration-300 active:scale-95"
        >
          {loading ? 'Loading...' : 'Start Classification'}
        </button>
      </section>

    </div>
  );
}

export default Landing;
