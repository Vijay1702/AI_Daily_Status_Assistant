import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Loader, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import logoUrl from '@/assets/logo.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    masterNo: '',
    dailyHours: 8,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'dailyHours' ? Number(e.target.value) : e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.register(formData);
      if (response.data.success) {
        navigate('/login');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-md md:p-xl relative overflow-hidden selection:bg-primary-500/30">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[1000px] bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl flex overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual/Marketing (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 p-xl bg-gradient-to-bl from-slate-900 to-slate-800 border-r border-white/5 relative flex-col items-center justify-center overflow-hidden group">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative">
              {/* Glow behind the logo */}
              <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full scale-150"></div>
              <img src={logoUrl} alt="Logo" className="w-64 h-64 object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-700" />
            </div>
            <h2 className="text-display-sm font-bold text-white font-inter tracking-tight mt-xl">Daily Status</h2>
            <p className="text-slate-400 text-body-lg mt-md max-w-[280px] mx-auto leading-relaxed">
              AI-powered status reporting and automated timesheet tracking.
            </p>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
          <div className="absolute left-0 top-0 -translate-x-1/3 -translate-y-1/3 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px]"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-xl lg:px-[72px] lg:py-xl bg-slate-900/80 flex flex-col justify-center max-h-[90vh] md:max-h-[800px] overflow-y-auto custom-scrollbar">
          <div className="mb-lg mt-md md:mt-0 text-center flex flex-col items-center">
            <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain drop-shadow-lg mb-lg" />
            <h1 className="text-headline-md font-semibold text-white mb-xs tracking-tight font-inter">Create an account</h1>
            <p className="text-slate-400 text-body-md font-inter">Start tracking your daily progress today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-md pb-md">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-md py-sm flex items-center gap-sm text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <div className="w-1 h-full bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            <div className="group">
              <label className="block text-sm font-medium text-slate-300 mb-xs font-inter group-focus-within:text-indigo-400 transition-colors">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="John Doe"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-slate-300 mb-xs font-inter group-focus-within:text-indigo-400 transition-colors">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="name@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-xs font-inter group-focus-within:text-indigo-400 transition-colors">
                  Master Number
                </label>
                <input
                  type="text"
                  name="masterNo"
                  value={formData.masterNo}
                  onChange={handleChange}
                  required
                  className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="EMP001"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-xs font-inter group-focus-within:text-indigo-400 transition-colors">
                  Daily Hours
                </label>
                <select
                  name="dailyHours"
                  value={formData.dailyHours}
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white transition-all duration-300 focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer appearance-none"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h} className="bg-slate-800 text-white">
                      {h} hours
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-slate-300 mb-xs font-inter group-focus-within:text-indigo-400 transition-colors">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-md py-sm bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'w-full py-sm mt-md rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-sm group relative overflow-hidden',
                loading ? 'bg-indigo-500/50 text-white cursor-wait' : 'bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98]'
              )}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-md text-center text-slate-400 text-sm font-inter pb-md">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-white hover:text-indigo-400 font-medium transition-colors border-b border-transparent hover:border-indigo-400"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
