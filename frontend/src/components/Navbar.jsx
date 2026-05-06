import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, GitCompare, History, LogIn, LogOut, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl"
      style={{ background: 'rgba(8,8,15,0.85)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trade<span className="text-indigo-400">Lab</span>
            <span className="text-[10px] text-gray-600 ml-1.5 font-normal tracking-wider">RISK ENGINE</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link to="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            Strategies
          </Link>
          <Link to="/compare"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/compare') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <GitCompare size={14} /> Compare
          </Link>
          <Link to="/history"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/history') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <History size={14} /> History
          </Link>
        </div>

        {/* Auth Section */}
        <div className="relative" ref={dropdownRef}>
          {user ? (
            <>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all text-sm text-gray-300 hover:text-white"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-xs">{user.email}</span>
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-48 rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                    style={{ background: '#1a1a24' }}
                  >
                    <Link to="/history" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <History size={14} /> My History
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors border-t border-white/5">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
                <LogIn size={13} /> Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
