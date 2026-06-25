import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/services/api';
import { Loader, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import logoUrl from '@/assets/logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.login({ email, password });
      if (response.data.success && response.data.data) {
        setAuth(response.data.data.user, response.data.data.token);
        localStorage.setItem('token', response.data.data.token);
        navigate('/chat');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-md md:p-xl relative overflow-hidden selection:bg-primary-500/30">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[1000px] bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl flex overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual/Marketing (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 p-xl bg-gradient-to-br from-slate-900 to-slate-800 border-r border-white/5 relative flex-col items-center justify-center overflow-hidden group">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative">
              {/* Glow behind the logo */}
              <div className="absolute inset-0 bg-primary-500/30 blur-[60px] rounded-full scale-150"></div>
              <img src={logoUrl} alt="Logo" className="w-64 h-64 object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-700" />
            </div>
            <h2 className="text-display-sm font-bold text-white font-inter tracking-tight mt-xl">Daily Status</h2>
            <p className="text-slate-400 text-body-lg mt-md max-w-[280px] mx-auto leading-relaxed">
              AI-powered status reporting and automated timesheet tracking.
            </p>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] group-hover:bg-primary-500/20 transition-colors duration-700"></div>
          <div className="absolute left-0 top-0 -translate-x-1/3 -translate-y-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-xl lg:p-[72px] bg-slate-900/80 flex flex-col justify-center">
          <div className="mb-xl text-center flex flex-col items-center">
            <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain drop-shadow-lg mb-lg" />
            <h1 className="text-headline-md font-semibold text-white mb-xs tracking-tight font-inter">Welcome back</h1>
            <p className="text-slate-400 text-body-md font-inter">Enter your details to sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-lg">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-md py-sm flex items-center gap-sm text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <div className="w-1 h-full bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            <div className="space-y-md">
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-xs font-inter group-focus-within:text-primary-400 transition-colors">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="name@company.com"
                />
              </div>

              <div className="group">
                <div className="flex items-center justify-between mb-xs">
                  <label className="block text-sm font-medium text-slate-300 font-inter group-focus-within:text-primary-400 transition-colors">
                    Password
                  </label>
                  <a href="#" className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium">Forgot password?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'w-full py-sm rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-sm group relative overflow-hidden',
                loading ? 'bg-primary-500/50 text-white cursor-wait' : 'bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98]'
              )}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-xl text-center text-slate-400 text-sm font-inter">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-white hover:text-primary-400 font-medium transition-colors border-b border-transparent hover:border-primary-400"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
