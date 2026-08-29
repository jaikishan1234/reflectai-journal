import React from 'react';
import { UserProfile } from '../types';
import { Sparkles, LogOut, ShieldCheck, Flame, BookOpen, BarChart2, PlusCircle, LineChart, HelpCircle } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  activeView: 'journal' | 'insights' | 'ask_journal';
  onViewChange: (view: 'journal' | 'insights' | 'ask_journal') => void;
  onSignOut: () => void;
  onOpenAuth: () => void;
  onNewEntry: () => void;
  onOpenAnalytics: () => void;
  onOpenSecurity: () => void;
  streakCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  onViewChange,
  onSignOut,
  onOpenAuth,
  onNewEntry,
  onOpenAnalytics,
  onOpenSecurity,
  streakCount,
}) => {
  return (
    <header className="w-full bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div 
            onClick={() => onViewChange('journal')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-stone-950 shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-100 tracking-tight text-lg">ReflectAI</span>
                <span className="text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">Mindful Reflections & Secure Storage</p>
            </div>
          </div>

          {/* Primary View Switcher */}
          {user && (
            <nav className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
              <button
                id="nav-tab-journal"
                onClick={() => onViewChange('journal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'journal'
                    ? 'bg-stone-800 text-amber-400 shadow-xs border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Journal</span>
              </button>

              <button
                id="nav-tab-insights"
                onClick={() => onViewChange('insights')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'insights'
                    ? 'bg-stone-800 text-amber-400 shadow-xs border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Personal Insights</span>
              </button>

              <button
                id="nav-tab-ask-journal"
                onClick={() => onViewChange('ask_journal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'ask_journal'
                    ? 'bg-stone-800 text-amber-400 shadow-xs border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask My Journal</span>
              </button>
            </nav>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              {/* Streak Badge */}
              <div 
                id="streak-indicator"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-800/80 border border-stone-700/60 rounded-lg text-xs font-medium text-stone-300"
                title="Current Reflection Streak"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/20 animate-pulse" />
                <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
              </div>

              {/* New Entry Button */}
              <button
                id="navbar-new-entry-btn"
                onClick={() => {
                  onNewEntry();
                  onViewChange('journal');
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Entry</span>
              </button>

              {/* Analytics Button */}
              <button
                id="navbar-analytics-btn"
                onClick={onOpenAnalytics}
                className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                title="View Insights & Trends"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Security & Deployment Docs */}
          <button
            id="navbar-security-btn"
            onClick={onOpenSecurity}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-400 hover:text-emerald-400 hover:bg-stone-800/80 border border-stone-800 rounded-lg transition-colors cursor-pointer"
            title="View Security Model & Cloud Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Security Architecture</span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-xs font-semibold text-stone-200 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-medium text-stone-200 truncate max-w-[120px]">{user.displayName}</div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[120px]">{user.email}</div>
                </div>
              </div>

              <button
                id="signout-button"
                onClick={onSignOut}
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

