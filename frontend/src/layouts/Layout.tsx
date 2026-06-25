import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/services/api';
import { MessageSquare, Settings, LogOut, Menu, X, FileText, Activity } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import logoUrl from '@/assets/logo.png';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Header - Mobile Only */}
      <header className="md:hidden bg-surface-dark-elevated border-b border-outline-dark sticky top-0 z-40">
        <div className="px-md py-md flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center gap-sm">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
            <h1 className="text-headline-md font-semibold text-white font-inter tracking-tight">
              Daily Status
            </h1>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={clsx(
              'inline-flex items-center justify-center p-sm rounded-md',
              'text-on-surface-dark hover:bg-surface-dark-container-high',
              'transition-colors duration-200'
            )}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Sidebar Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-outline-dark p-md space-y-sm">
            {navItems.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setMobileMenuOpen(false);
                }}
                className={clsx(
                  'w-full text-left px-md py-md rounded text-body-md font-medium transition-colors duration-200 flex items-center gap-md',
                  isActive(path)
                    ? 'bg-surface-dark-container-high text-on-surface-dark border border-outline-dark'
                    : 'text-outline hover:bg-surface-dark-container-highest hover:text-on-surface-dark'
                )}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
            <div className="border-t border-outline-dark pt-md mt-md">
              <div className="px-md py-sm mb-md">
                <p className="text-label-md text-outline font-geist">Account</p>
                <p className="text-body-md text-on-surface-dark font-medium mt-xs">{user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className={clsx(
                  'w-full text-left px-md py-md rounded-md text-body-md font-medium transition-colors duration-200 flex items-center gap-md',
                  'text-error hover:bg-surface-dark-container-high'
                )}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden md:flex md:w-80 bg-surface-dark-elevated border-r border-outline-dark flex-col sticky top-0 h-screen z-10">
        {/* Sidebar Header with Logo */}
        <div className="px-lg py-lg border-b border-outline-dark flex items-center gap-md">
          <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-headline-md font-semibold text-on-surface-dark font-inter tracking-tight">
            Daily Status
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-md py-lg space-y-sm overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={clsx(
                'w-full text-left px-md py-md rounded text-body-md font-medium transition-colors duration-200 flex items-center gap-md',
                isActive(path)
                  ? 'bg-surface-dark-container-high text-on-surface-dark border border-outline-dark'
                  : 'text-outline hover:bg-surface-dark-container-highest hover:text-on-surface-dark'
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-outline-dark p-lg space-y-md">
          <div>
            <p className="text-label-md text-outline font-geist">Account</p>
            <p className="text-body-md text-on-surface-dark font-medium mt-xs truncate">{user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              'w-full px-md py-md rounded text-body-md font-medium transition-colors duration-200 flex items-center justify-center gap-md',
              'text-error hover:bg-surface-dark-container-high border border-error/20'
            )}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Page Content */}
        <div className="flex-1 px-md sm:px-lg lg:px-lg py-lg overflow-y-auto">
          <Outlet />
        </div>

        {/* Footer - Mobile Only */}
        <footer className="md:hidden bg-surface-dark-elevated border-t border-outline-dark">
          <div className="px-md py-md">
            <p className="text-center text-outline text-body-sm">
              © 2026 AI Daily Status Assistant
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
