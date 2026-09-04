import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ActiveViewType } from '../types';
import {
  Sparkles,
  LogOut,
  ShieldCheck,
  Flame,
  BookOpen,
  Plus,
  LineChart,
  HelpCircle,
  Compass,
  HeartPulse,
  Gift,
  ChevronDown,
  Brain
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
  onOpenAnalytics: _onOpenAnalytics,
  onOpenSecurity,
  streakCount,
}) => {
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
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
    <header className="w-full bg-[#111416] border-b border-[#30383F] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 md:gap-4">
        {/* LEFT: Brand Area */}
        <div 
          onClick={() => onViewChange('journal')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          title="ReflectAI - Return to Journal"
        >
          <div className="w-8 h-8 rounded-lg bg-[#3282B8]/15 border border-[#3282B8]/30 flex items-center justify-center text-[#4FA3D1] group-hover:border-[#3282B8]/60 transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#F4F1EA] tracking-tight text-base sm:text-lg">ReflectAI</span>
              <span className="text-[10px] font-medium text-[#747C82] border border-[#30383F] bg-[#171B1F] px-1.5 py-0.5 rounded-md">
                Gemini 3.6
              </span>
            </div>
            <p className="text-[11px] text-[#A7ADB2] hidden sm:block leading-tight">Mindful Reflections & Secure Storage</p>
          </div>
        </div>

        {/* CENTER: Main Navigation */}
        {user && (
          <nav className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 py-1">
            {/* Journal - Primary destination */}
            <button
              id="nav-tab-journal"
              type="button"
              onClick={() => onViewChange('journal')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'journal'
                  ? 'bg-[#3282B8] text-white font-semibold shadow-xs'
                  : 'text-[#A7ADB2] hover:text-[#F4F1EA] hover:bg-[#171B1F]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${activeView === 'journal' ? 'text-white' : 'text-[#747C82]'}`} />
              <span>Journal</span>
            </button>

            {/* Intelligence */}
            <button
              id="nav-tab-intelligence"
              type="button"
              onClick={() => onViewChange('intelligence')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'intelligence'
                  ? 'bg-[#3282B8] text-white font-semibold shadow-xs'
                  : 'text-[#A7ADB2] hover:text-[#F4F1EA] hover:bg-[#171B1F]'
              }`}
            >
              <Brain className={`w-3.5 h-3.5 ${activeView === 'intelligence' ? 'text-white' : 'text-[#747C82]'}`} />
              <span>Intelligence</span>
            </button>

            {/* Personal Insights Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="nav-tab-insights-dropdown"
                type="button"
                onClick={() => setIsInsightsOpen(prev => !prev)}
                aria-expanded={isInsightsOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isInsightsActive
                    ? 'bg-[#3282B8] text-white font-semibold shadow-xs'
                    : isInsightsOpen
                    ? 'bg-[#171B1F] text-[#F4F1EA]'
                    : 'text-[#A7ADB2] hover:text-[#F4F1EA] hover:bg-[#171B1F]'
                }`}
              >
                <LineChart className={`w-3.5 h-3.5 ${isInsightsActive ? 'text-white' : isInsightsOpen ? 'text-[#F4F1EA]' : 'text-[#747C82]'}`} />
                <span>Personal Insights</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isInsightsOpen ? 'rotate-180' : ''} ${isInsightsActive ? 'text-white' : isInsightsOpen ? 'text-[#F4F1EA]' : 'text-[#747C82]'}`} />
              </button>

              {/* Dropdown Menu */}
              {isInsightsOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1D2328] border border-[#30383F] rounded-xl shadow-2xl shadow-black/80 p-1.5 z-50">
                  {/* Insights Overview */}
                  <button
                    id="dropdown-insights-overview"
                    type="button"
                    onClick={() => handleSelectInsightView('insights')}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      activeView === 'insights'
                        ? 'bg-[#252C32] text-[#4FA3D1]'
                        : 'text-[#F4F1EA] hover:bg-[#252C32]/70'
                    }`}
                  >
                    <LineChart className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'insights' ? 'text-[#4FA3D1]' : 'text-[#747C82]'}`} />
                    <div>
                      <div className="text-xs font-medium text-[#F4F1EA]">Overview</div>
                      <div className="text-[11px] text-[#A7ADB2]">Themes, mood analysis, and patterns</div>
                    </div>
                  </button>

                  {/* Your Story */}
                  <button
                    id="dropdown-your-story"
                    type="button"
                    onClick={() => handleSelectInsightView('story')}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      activeView === 'story'
                        ? 'bg-[#252C32] text-[#4FA3D1]'
                        : 'text-[#F4F1EA] hover:bg-[#252C32]/70'
                    }`}
                  >
                    <Compass className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'story' ? 'text-[#4FA3D1]' : 'text-[#747C82]'}`} />
                    <div>
                      <div className="text-xs font-medium text-[#F4F1EA]">Your Story</div>
                      <div className="text-[11px] text-[#A7ADB2]">Chronological journey and change tracking</div>
                    </div>
                  </button>

                  {/* Wellbeing */}
                  <button
                    id="dropdown-wellbeing"
                    type="button"
                    onClick={() => handleSelectInsightView('wellbeing')}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      activeView === 'wellbeing'
                        ? 'bg-[#252C32] text-[#4FA3D1]'
                        : 'text-[#F4F1EA] hover:bg-[#252C32]/70'
                    }`}
                  >
                    <HeartPulse className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'wellbeing' ? 'text-[#4FA3D1]' : 'text-[#747C82]'}`} />
                    <div>
                      <div className="text-xs font-medium text-[#F4F1EA]">Wellbeing</div>
                      <div className="text-[11px] text-[#A7ADB2]">Workload, focus, and recovery signals</div>
                    </div>
                  </button>

                  {/* Wrapped */}
                  <button
                    id="dropdown-wrapped"
                    type="button"
                    onClick={() => handleSelectInsightView('wrapped')}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      activeView === 'wrapped'
                        ? 'bg-[#252C32] text-[#4FA3D1]'
                        : 'text-[#F4F1EA] hover:bg-[#252C32]/70'
                    }`}
                  >
                    <Gift className={`w-4 h-4 mt-0.5 shrink-0 ${activeView === 'wrapped' ? 'text-[#4FA3D1]' : 'text-[#747C82]'}`} />
                    <div>
                      <div className="text-xs font-medium text-[#F4F1EA]">Wrapped</div>
                      <div className="text-[11px] text-[#A7ADB2]">Milestone story & retrospective</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Ask My Journal */}
            <button
              id="nav-tab-ask-journal"
              type="button"
              onClick={() => onViewChange('ask_journal')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'ask_journal'
                  ? 'bg-[#3282B8] text-white font-semibold shadow-xs'
                  : 'text-[#A7ADB2] hover:text-[#F4F1EA] hover:bg-[#171B1F]'
              }`}
            >
              <HelpCircle className={`w-3.5 h-3.5 ${activeView === 'ask_journal' ? 'text-white' : 'text-[#747C82]'}`} />
              <span>Ask My Journal</span>
            </button>
          </nav>
        )}

        {/* RIGHT: Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {user && (
            <>
              {/* Streak Indicator - Subtle, compact secondary status indicator */}
              <div 
                id="streak-indicator"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#171B1F] border border-[#30383F] rounded-lg text-xs font-medium text-[#A7ADB2]"
                title="Current Reflection Streak"
              >
                <Flame className="w-3.5 h-3.5 text-[#3282B8]" />
                <span className="text-[#F4F1EA] font-medium">{streakCount}d</span>
              </div>

              {/* New Entry Button - Main CTA, compact button displaying + New Entry */}
              <button
                id="navbar-new-entry-btn"
                type="button"
                onClick={() => {
                  onNewEntry();
                  onViewChange('journal');
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#3282B8] hover:bg-[#4FA3D1] text-white font-medium text-xs rounded-lg transition-colors shadow-xs active:scale-95 cursor-pointer shrink-0"
                title="Create New Journal Entry"
              >
                <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="whitespace-nowrap">New Entry</span>
              </button>
            </>
          )}

          {/* Subtle Vertical Divider */}
          <div className="h-4 w-px bg-[#30383F] hidden sm:block" />

          {/* Security Architecture - Secondary Utility */}
          <button
            id="navbar-security-btn"
            type="button"
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#747C82] hover:text-[#A7ADB2] hover:bg-[#1D2328] rounded-lg transition-colors cursor-pointer"
            title="View Security Model & Cloud Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#747C82]" />
            <span className="hidden xl:inline">Security Architecture</span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#252C32] border border-[#30383F] flex items-center justify-center text-xs font-medium text-[#F4F1EA] overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-medium text-[#F4F1EA] truncate max-w-[100px]">{user.displayName}</div>
                  <div className="text-[10px] text-[#747C82] truncate max-w-[100px]">{user.email}</div>
                </div>
              </div>

              <button
                id="signout-button"
                type="button"
                onClick={onSignOut}
                className="p-1.5 text-[#747C82] hover:text-[#F4F1EA] hover:bg-[#1D2328] rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 bg-[#3282B8] hover:bg-[#4FA3D1] text-white font-medium text-xs rounded-lg transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


