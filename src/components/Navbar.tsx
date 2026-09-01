import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ActiveViewType } from '../types';
import {
  Sparkles,
  LogOut,
  ShieldCheck,
  Flame,
  BookOpen,
  PlusCircle,
  LineChart,
  HelpCircle,
  Compass,
  HeartPulse,
  Gift,
  ChevronDown,
  Activity,
  BarChart2
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  activeView: ActiveViewType;
  onViewChange: (view: ActiveViewType) => void;
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
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsInsightsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInsightsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isInsightsActive =
    activeView === 'insights' ||
    activeView === 'story' ||
    activeView === 'wellbeing' ||
    activeView === 'wrapped';

  const handleSelectInsightView = (view: ActiveViewType) => {
    onViewChange(view);
    setIsInsightsOpen(false);
  };

  return (
    <header className="w-full bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Navigation */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div 
            onClick={() => onViewChange('journal')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-stone-950 shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-stone-100 tracking-tight text-base sm:text-lg">ReflectAI</span>
                <span className="text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400 hidden sm:block">Mindful Reflections & Secure Storage</p>
            </div>
          </div>

          {/* Primary View Switcher */}
          {user && (
            <nav className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
              {/* Journal */}
              <button
                id="nav-tab-journal"
                onClick={() => onViewChange('journal')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'journal'
                    ? 'bg-stone-800 text-amber-400 shadow-xs border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Journal</span>
              </button>

              {/* Personal Insights Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="nav-tab-insights-dropdown"
                  onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                  aria-expanded={isInsightsOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isInsightsActive
                      ? 'bg-stone-800 text-amber-400 shadow-xs border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Personal Insights</span>
                  <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isInsightsOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isInsightsOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 sm:w-64 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl shadow-stone-950/80 p-1.5 z-50 animate-fadeIn">
                    {/* Insights Overview */}
                    <button
                      id="dropdown-insights-overview"
                      onClick={() => handleSelectInsightView('insights')}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        activeView === 'insights'
                          ? 'bg-stone-800/90 text-amber-400'
                          : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
                      }`}
                    >
                      <LineChart className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'insights' ? 'text-amber-400' : 'text-stone-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">Overview</div>
                        <div className="text-[10px] text-stone-400">Themes, mood analysis, and patterns</div>
                      </div>
                    </button>

                    {/* Your Story */}
                    <button
                      id="dropdown-your-story"
                      onClick={() => handleSelectInsightView('story')}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        activeView === 'story'
                          ? 'bg-stone-800/90 text-amber-400'
                          : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
                      }`}
                    >
                      <Compass className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'story' ? 'text-amber-400' : 'text-stone-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">Your Story</div>
                        <div className="text-[10px] text-stone-400">Chronological journey and change tracking</div>
                      </div>
                    </button>

                    {/* Wellbeing */}
                    <button
                      id="dropdown-wellbeing"
                      onClick={() => handleSelectInsightView('wellbeing')}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        activeView === 'wellbeing'
                          ? 'bg-stone-800/90 text-amber-400'
                          : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
                      }`}
                    >
                      <HeartPulse className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'wellbeing' ? 'text-rose-400' : 'text-stone-400'}`} />
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>Wellbeing</span>
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded-full font-medium">New</span>
                        </div>
                        <div className="text-[10px] text-stone-400">Workload, focus, and recovery signals</div>
                      </div>
                    </button>

                    {/* Wrapped */}
                    <button
                      id="dropdown-wrapped"
                      onClick={() => handleSelectInsightView('wrapped')}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        activeView === 'wrapped'
                          ? 'bg-stone-800/90 text-amber-400'
                          : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
                      }`}
                    >
                      <Gift className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'wrapped' ? 'text-amber-400' : 'text-stone-400'}`} />
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>Wrapped</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full font-medium">New</span>
                        </div>
                        <div className="text-[10px] text-stone-400">Milestone story & retrospective</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Ask My Journal */}
              <button
                id="nav-tab-ask-journal"
                onClick={() => onViewChange('ask_journal')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user && (
            <>
              {/* Streak Badge */}
              <div 
                id="streak-indicator"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-800/80 border border-stone-700/60 rounded-lg text-xs font-medium text-stone-300"
                title="Current Reflection Streak"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/20 animate-pulse" />
                <span className="hidden xs:inline">{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
                <span className="xs:hidden">{streakCount}d</span>
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
                  <div className="text-xs font-medium text-stone-200 truncate max-w-[110px]">{user.displayName}</div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[110px]">{user.email}</div>
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


