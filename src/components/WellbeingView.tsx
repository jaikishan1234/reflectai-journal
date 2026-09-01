import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Coffee,
  Sun,
  Brain,
  Compass,
  MessageSquarePlus,
  Info,
  ChevronRight,
  PlusCircle,
  Tag
} from 'lucide-react';
import { JournalEntry, UserProfile, WellbeingAnalysisResponse, WellbeingSignal } from '../types';

interface WellbeingViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
  onStartDailyPrompt?: (prompt: string, title?: string) => void;
}

const WELLBEING_CACHE_KEY_PREFIX = 'reflectai_wellbeing_cache_';

export const WellbeingView: React.FC<WellbeingViewProps> = ({
  entries,
  user,
  onNewEntry,
  onStartDailyPrompt,
}) => {
  const [data, setData] = useState<WellbeingAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to user's entries and sort chronologically
  const userEntries = entries
    .filter((e) => e.userId === user.uid)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  const cacheKey = `${WELLBEING_CACHE_KEY_PREFIX}${user.uid}`;
  const currentEntriesHash = `${user.uid}_${userEntries.length}_${userEntries.map(e => e.id + (e.updatedAt || e.createdAt)).join('_')}`;

  const fetchWellbeingAnalysis = async (forceRefresh: boolean = false) => {
    if (userEntries.length < 2) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.analyzedEntryCount === userEntries.length && cached.cachedHash === currentEntriesHash) {
            setData(cached.payload);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not read cached wellbeing data:', e);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/wellbeing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          entries: userEntries.map((e) => ({
            id: e.id,
            title: e.title,
            content: e.content,
            mood: e.mood,
            tags: e.tags,
            createdAt: e.createdAt,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with HTTP ${response.status}`);
      }

      const resData: WellbeingAnalysisResponse = await response.json();
      setData(resData);

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          cachedHash: currentEntriesHash,
          analyzedEntryCount: userEntries.length,
          payload: resData,
        }));
      } catch (cacheErr) {
        console.warn('Could not store wellbeing cache:', cacheErr);
      }
    } catch (err: any) {
      console.error('Error in fetchWellbeingAnalysis:', err);
      setError(err?.message || 'Failed to load wellbeing analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWellbeingAnalysis(false);
  }, [userEntries.length, user.uid]);

  // Helper for trend badge
  const renderTrendBadge = (trend: 'improving' | 'stable' | 'increasing', type?: string) => {
    if (trend === 'improving') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Improving</span>
        </span>
      );
    }
    if (trend === 'increasing') {
      const isPositive = type === 'recovery' || type === 'routine' || type === 'motivation';
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isPositive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isPositive ? 'Increasing (Positive)' : 'Elevated Signals'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-700/50 text-stone-300 border border-stone-600/50">
        <Minus className="w-3.5 h-3.5" />
        <span>Steady Pattern</span>
      </span>
    );
  };

  // Helper for Status indicator
  const renderStatusBadge = (status: 'improving' | 'stable' | 'needs_attention') => {
    switch (status) {
      case 'improving':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Positive Trend</span>
          </div>
        );
      case 'needs_attention':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Elevated Workload Signals</span>
          </div>
        );
      case 'stable':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Minus className="w-4 h-4" />
            <span className="text-xs font-semibold">Steady Pacing</span>
          </div>
        );
    }
  };

  // Category icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rest':
        return <Coffee className="w-4 h-4 text-emerald-400" />;
      case 'focus':
        return <Brain className="w-4 h-4 text-amber-400" />;
      case 'routine':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'reflection':
      default:
        return <Sparkles className="w-4 h-4 text-orange-400" />;
    }
  };

  // Insufficient data view
  if (userEntries.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight mb-3">
            Wellbeing & Burnout Signals
          </h2>
          <p className="text-stone-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            ReflectAI observes longitudinal signals—such as workload intensity, cognitive fatigue, and recovery patterns—across your reflections. You need at least 2 journal entries across different dates to reveal emerging patterns.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="wellbeing-new-entry-btn"
              onClick={onNewEntry}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write a New Reflection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Wellbeing & Burnout Signals</h1>
                {data && renderStatusBadge(data.overallStatus)}
              </div>
              <p className="text-xs text-stone-400">
                Longitudinal patterns of workload, cognitive fatigue, focus, and recovery
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="regenerate-wellbeing-btn"
            onClick={() => fetchWellbeingAnalysis(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Refresh wellbeing patterns"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-stone-400'}`} />
            <span>{isLoading ? 'Analyzing Signals...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Non-Diagnostic Product Principle Banner */}
      <div className="bg-stone-900/90 border border-stone-800/90 rounded-xl p-4 flex items-start gap-3 text-xs text-stone-300">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-200">Non-Diagnostic Self-Reflection Guarantee</p>
          <p className="text-stone-400 leading-relaxed">
            ReflectAI highlights observable patterns and trends in your private writings to foster personal clarity. This tool does not diagnose medical conditions, burnout syndromes, or mental health disorders.
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 h-36"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 h-48"></div>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 h-48"></div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 h-64"></div>
        </div>
      )}

      {/* Error Notice */}
      {error && !isLoading && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-6 text-center text-rose-200 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => fetchWellbeingAnalysis(true)}
            className="px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Main Analysis Body */}
      {data && !isLoading && (
        <div className="space-y-8">
          {/* SECTION 1: Wellbeing Overview */}
          <section className="bg-gradient-to-br from-stone-900 to-stone-900/80 border border-stone-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Sun className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-stone-100">Wellbeing Overview</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>{data.analyzedEntryCount} entries analyzed</span>
                <span className="text-stone-600">•</span>
                <span className="text-[11px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md border border-stone-700">
                  {data.modelUsed}
                </span>
              </div>
            </div>

            <p className="text-stone-200 text-sm leading-relaxed sm:text-base font-normal">
              {data.statusExplanation}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3.5">
                <div className="text-[11px] text-stone-400 font-medium uppercase tracking-wider mb-1">Observed Status</div>
                <div className="text-sm font-semibold capitalize text-stone-200">
                  {data.overallStatus === 'needs_attention' ? 'Elevated Signals' : data.overallStatus}
                </div>
              </div>
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3.5">
                <div className="text-[11px] text-stone-400 font-medium uppercase tracking-wider mb-1">Period Trajectory</div>
                <div className="text-sm font-semibold capitalize text-stone-200">
                  {data.trendComparison?.trajectory || 'Stable'}
                </div>
              </div>
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3.5">
                <div className="text-[11px] text-stone-400 font-medium uppercase tracking-wider mb-1">Tracked Signals</div>
                <div className="text-sm font-semibold text-stone-200">
                  {data.signals.length} Key Patterns
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Daily Reflection Prompt Component */}
          {data.dailyPrompt && (
            <section className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/25 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Daily Reflection Inquiry
                    </span>
                    <span className="text-xs text-stone-400">Paced for today</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-stone-100 tracking-tight">
                    "{data.dailyPrompt.question}"
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {data.dailyPrompt.context}
                  </p>
                </div>

                <button
                  id="wellbeing-start-prompt-btn"
                  onClick={() => {
                    if (onStartDailyPrompt) {
                      onStartDailyPrompt(data.dailyPrompt.question, 'Daily Wellbeing Reflection');
                    } else {
                      onNewEntry();
                    }
                  }}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Reflect on this Prompt</span>
                </button>
              </div>
            </section>
          )}

          {/* SECTION 3: Recent Signals */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-stone-100">Recent Signals & Thematic Patterns</h2>
              </div>
              <span className="text-xs text-stone-400">Grounded in authentic entries</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="bg-stone-900 border border-stone-800 hover:border-stone-700/80 rounded-2xl p-5 transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-stone-100">{sig.label}</h3>
                      {renderTrendBadge(sig.trend, sig.type)}
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {sig.description}
                    </p>
                  </div>

                  {/* Evidence Quotes */}
                  {sig.quotes && sig.quotes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-stone-800/80">
                      <div className="text-[11px] text-stone-400 font-medium">Journal Evidence:</div>
                      {sig.quotes.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-stone-950/70 border border-stone-800/60 rounded-xl p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-400">
                            <span className="font-semibold text-stone-300 truncate max-w-[180px]">{q.entryTitle}</span>
                            <span>{q.date}</span>
                          </div>
                          <p className="text-stone-300 italic text-[11px] leading-relaxed">
                            "{q.excerpt}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: Trend Over Time */}
          {data.trendComparison && (
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-stone-100">Trend Over Time</h2>
                </div>
                <div className="text-xs text-stone-400 flex items-center gap-1.5">
                  <span>Trajectory:</span>
                  <span className="font-semibold text-stone-200 capitalize">{data.trendComparison.trajectory}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earlier Period */}
                <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">Earlier Period</span>
                    <span className="text-stone-400">{data.trendComparison.earlierPeriod.dateRange}</span>
                  </div>
                  <div className="text-sm font-semibold text-stone-200">
                    {data.trendComparison.earlierPeriod.signalIntensity}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {data.trendComparison.earlierPeriod.summary}
                  </p>
                </div>

                {/* Recent Period */}
                <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Recent Period</span>
                    <span className="text-stone-400">{data.trendComparison.recentPeriod.dateRange}</span>
                  </div>
                  <div className="text-sm font-semibold text-stone-200">
                    {data.trendComparison.recentPeriod.signalIntensity}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {data.trendComparison.recentPeriod.summary}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-3 rounded-xl border border-stone-800/60">
                <strong className="text-stone-200">Analysis:</strong> {data.trendComparison.trajectoryExplanation}
              </p>
            </section>
          )}

          {/* SECTION 5: AI Reflection & Companion Synthesis */}
          {data.aiReflection && (
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-stone-100">Reflective AI Observations</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Key Observations
                  </h4>
                  <ul className="space-y-2 text-xs text-stone-300">
                    {data.aiReflection.observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    Patterns Noticed
                  </h4>
                  <ul className="space-y-2 text-xs text-stone-300">
                    {data.aiReflection.patternsNoticed.map((pat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{pat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {data.aiReflection.encouragement && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-stone-200 leading-relaxed italic">
                  "{data.aiReflection.encouragement}"
                </div>
              )}
            </section>
          )}

          {/* SECTION 6: Actionable Suggestions */}
          {data.actionableSuggestions && data.actionableSuggestions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-stone-100">Gentle Actionable Suggestions</h2>
                </div>
                <span className="text-xs text-stone-400">Micro-adjustments for ease</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.actionableSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-stone-800 border border-stone-700 shrink-0">
                      {getCategoryIcon(sug.category)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-200">{sug.title}</h4>
                      <p className="text-xs text-stone-400 leading-relaxed">{sug.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Privacy Note */}
          <div className="text-center pt-4 pb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/80 border border-stone-800 text-stone-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated to user {user.email || user.uid}. Encrypted and owner-bound in Firestore.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
