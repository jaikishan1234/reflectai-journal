import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  TrendingUp,
  Minus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  Coffee,
  Brain,
  Compass,
  MessageSquarePlus,
  Info,
  PlusCircle,
  Tag
} from 'lucide-react';
import { JournalEntry, UserProfile, WellbeingAnalysisResponse, WellbeingSignal } from '../types';

interface WellbeingViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
  onStartDailyPrompt?: (prompt: string, title?: string) => void;
  onSelectEntry?: (entry: JournalEntry) => void;
}

const WELLBEING_CACHE_KEY_PREFIX = 'reflectai_wellbeing_cache_';

export const WellbeingView: React.FC<WellbeingViewProps> = ({
  entries,
  user,
  onNewEntry,
  onStartDailyPrompt,
  onSelectEntry,
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

  // Compute mood frequencies from user's journal entries
  const moodCounts: Record<string, number> = {};
  userEntries.forEach((e) => {
    const m = e.mood ? e.mood.toLowerCase() : 'thoughtful';
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });
  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

  // Helper for trend badge
  const renderTrendBadge = (trend: 'improving' | 'stable' | 'increasing', type?: string) => {
    if (trend === 'improving') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#16271F] text-[#34D399] border border-[#34D399]/25">
          <TrendingUp className="w-3 h-3" />
          <span>Positive progress</span>
        </span>
      );
    }
    if (trend === 'increasing') {
      const isPositive = type === 'recovery' || type === 'routine' || type === 'motivation';
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isPositive 
            ? 'bg-[#16271F] text-[#34D399] border border-[#34D399]/25' 
            : 'bg-[#2A2315] text-[#FBBF24] border border-[#FBBF24]/25'
        }`}>
          <TrendingUp className="w-3 h-3" />
          <span>{isPositive ? 'Increasing (positive)' : 'Notable shift'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#252C32] text-[#A7ADB2] border border-[#30383F]">
        <Minus className="w-3 h-3" />
        <span>Steady rhythm</span>
      </span>
    );
  };

  // Helper for Status indicator
  const renderStatusBadge = (status: 'improving' | 'stable' | 'needs_attention') => {
    switch (status) {
      case 'improving':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#16271F] border border-[#34D399]/25 text-[#34D399]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Positive Balance</span>
          </div>
        );
      case 'needs_attention':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#2A2315] border border-[#FBBF24]/25 text-[#FBBF24]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Noticed Shifts</span>
          </div>
        );
      case 'stable':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#171B1F] border border-[#30383F] text-[#A7ADB2]">
            <Minus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Steady Rhythm</span>
          </div>
        );
    }
  };

  // Category icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rest':
        return <Coffee className="w-4 h-4 text-[#34D399]" />;
      case 'focus':
        return <Brain className="w-4 h-4 text-[#A78BFA]" />;
      case 'routine':
        return <Clock className="w-4 h-4 text-[#4FA3D1]" />;
      case 'reflection':
      default:
        return <Sparkles className="w-4 h-4 text-[#FBBF24]" />;
    }
  };

  // Insufficient data view (< 2 entries)
  if (userEntries.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#252C32] border border-[#30383F] text-[#4FA3D1] flex items-center justify-center mx-auto mb-5">
            <Heart className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[#F4F1EA] tracking-tight mb-2.5">
            Wellbeing Reflections
          </h2>
          <p className="text-[#A7ADB2] text-sm max-w-md mx-auto mb-6 leading-relaxed">
            ReflectAI observes emotional pacing, cognitive focus, and balance across your journal writing. At least 2 reflections across different moments are needed to recognize longitudinal patterns.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="wellbeing-new-entry-btn"
              onClick={onNewEntry}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3282B8] hover:bg-[#286894] text-[#F4F1EA] font-medium text-xs rounded-xl transition-colors cursor-pointer"
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
    <div className="max-w-5xl mx-auto w-full py-6 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#30383F]">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] tracking-tight">Wellbeing</h1>
            {data && renderStatusBadge(data.overallStatus)}
          </div>
          <p className="text-sm text-[#A7ADB2]">
            Reflect on the patterns in how you've been feeling through your journal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 text-xs text-[#747C82] bg-[#171B1F] border border-[#30383F] px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Private & isolated</span>
          </div>
          <button
            id="regenerate-wellbeing-btn"
            onClick={() => fetchWellbeingAnalysis(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#171B1F] hover:bg-[#252C32] disabled:opacity-50 text-[#F4F1EA] text-xs font-medium rounded-xl border border-[#30383F] transition-colors cursor-pointer"
            title="Refresh wellbeing patterns"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#4FA3D1]' : 'text-[#747C82]'}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh Reflections'}</span>
          </button>
        </div>
      </div>

      {/* Non-Clinical Reflective Principle Banner */}
      <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 flex items-start gap-3 text-xs text-[#A7ADB2]">
        <Info className="w-4 h-4 text-[#747C82] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#F4F1EA]">Journal-Based Self-Reflection</p>
          <p className="leading-relaxed">
            ReflectAI highlights observable patterns and trends in your private journal entries to support mindful self-awareness. This tool does not diagnose medical or mental health conditions.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#4FA3D1] animate-spin mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#F4F1EA]">Observing Patterns in Your Reflections</h3>
          <p className="text-xs text-[#A7ADB2] max-w-sm mx-auto leading-relaxed">
            Synthesizing emotional rhythm, focus pacing, and journal-derived observations...
          </p>
        </div>
      )}

      {/* Error Notice */}
      {error && !isLoading && (
        <div className="bg-[#2D1B1B] border border-[#F87171]/30 rounded-xl p-4 text-xs text-[#F87171] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchWellbeingAnalysis(true)}
            className="px-2.5 py-1 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F4F1EA] rounded-md font-medium text-[11px] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Analysis Body */}
      {data && !isLoading && (
        <div className="space-y-8">
          {/* SECTION 1: Emotional & Reflective Overview */}
          <section className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#30383F]">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-[#4FA3D1]" />
                <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                  What Your Journal Reflects
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#747C82]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{data.analyzedEntryCount} entries analyzed</span>
                <span>•</span>
                <span className="font-mono text-[#A7ADB2]">{data.modelUsed}</span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#F4F1EA] leading-relaxed font-normal">
              {data.statusExplanation}
            </p>

            {/* Mood Frequency & Trajectory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 space-y-1">
                <div className="text-[11px] text-[#747C82] font-medium uppercase tracking-wider">
                  Emotional Pacing
                </div>
                <div className="text-sm font-semibold capitalize text-[#F4F1EA]">
                  {data.overallStatus === 'needs_attention' ? 'Noticed Shifts' : data.overallStatus === 'improving' ? 'Positive Progress' : 'Steady Rhythm'}
                </div>
              </div>

              <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 space-y-1">
                <div className="text-[11px] text-[#747C82] font-medium uppercase tracking-wider">
                  Period Trajectory
                </div>
                <div className="text-sm font-semibold capitalize text-[#F4F1EA]">
                  {data.trendComparison?.trajectory || 'Stable'}
                </div>
              </div>

              <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 space-y-1">
                <div className="text-[11px] text-[#747C82] font-medium uppercase tracking-wider">
                  Documented Patterns
                </div>
                <div className="text-sm font-semibold text-[#F4F1EA]">
                  {data.signals.length} {data.signals.length === 1 ? 'core theme' : 'core themes'}
                </div>
              </div>
            </div>

            {/* Restrained Mood Distribution */}
            {sortedMoods.length > 0 && (
              <div className="pt-2 border-t border-[#30383F] flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#747C82] mr-1">Frequent moods recorded:</span>
                {sortedMoods.map(([mood, count]) => (
                  <span
                    key={mood}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#171B1F] border border-[#30383F] text-[#A7ADB2]"
                  >
                    <span className="capitalize">{mood}</span>
                    <span className="text-[11px] font-mono text-[#747C82]">({count})</span>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: Daily Reflection Prompt (Editorial Invitation) */}
          {data.dailyPrompt && (
            <section className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-7 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium bg-[#3282B8]/15 text-[#4FA3D1] border border-[#3282B8]/30 px-2.5 py-0.5 rounded-full">
                      Daily Reflection Inquiry
                    </span>
                    <span className="text-xs text-[#747C82]">Paced for today</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#F4F1EA] tracking-tight">
                    "{data.dailyPrompt.question}"
                  </h3>
                  <p className="text-xs text-[#A7ADB2] leading-relaxed">
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
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-[#3282B8] hover:bg-[#286894] text-[#F4F1EA] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Reflect on this Prompt</span>
                </button>
              </div>
            </section>
          )}

          {/* SECTION 3: Grounded Observational Signals */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[#30383F]">
              <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                Reflective Signals & Observations
              </h2>
              <span className="text-xs text-[#747C82]">Grounded in authentic journal entries</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-[#F4F1EA]">{sig.label}</h3>
                      {renderTrendBadge(sig.trend, sig.type)}
                    </div>
                    <p className="text-xs sm:text-sm text-[#A7ADB2] leading-relaxed font-normal">
                      {sig.description}
                    </p>
                  </div>

                  {/* Evidence Quotes */}
                  {sig.quotes && sig.quotes.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-[#30383F]">
                      <div className="text-[11px] text-[#747C82] font-medium">Based on your journal entries:</div>
                      {sig.quotes.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-[#171B1F] border border-[#30383F] rounded-xl p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#A7ADB2]">
                            <span className="font-medium text-[#F4F1EA] truncate max-w-[200px]">"{q.entryTitle}"</span>
                            <span className="font-mono text-[#747C82]">{q.date}</span>
                          </div>
                          <blockquote className="pl-2.5 border-l-2 border-[#30383F] text-[#A7ADB2] italic text-[11px] leading-relaxed">
                            "{q.excerpt}"
                          </blockquote>
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
            <section className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#30383F] pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#4FA3D1]" />
                  <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                    Progression Over Time
                  </h2>
                </div>
                <div className="text-xs text-[#747C82] flex items-center gap-1.5">
                  <span>Trajectory:</span>
                  <span className="font-medium text-[#F4F1EA] capitalize">{data.trendComparison.trajectory}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earlier Period */}
                <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#747C82] uppercase tracking-wider text-[10px]">Earlier Period</span>
                    <span className="text-[#747C82] font-mono">{data.trendComparison.earlierPeriod.dateRange}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F4F1EA]">
                    {data.trendComparison.earlierPeriod.signalIntensity}
                  </div>
                  <p className="text-xs text-[#A7ADB2] leading-relaxed">
                    {data.trendComparison.earlierPeriod.summary}
                  </p>
                </div>

                {/* Recent Period */}
                <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#4FA3D1] uppercase tracking-wider text-[10px]">Recent Period</span>
                    <span className="text-[#747C82] font-mono">{data.trendComparison.recentPeriod.dateRange}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F4F1EA]">
                    {data.trendComparison.recentPeriod.signalIntensity}
                  </div>
                  <p className="text-xs text-[#A7ADB2] leading-relaxed">
                    {data.trendComparison.recentPeriod.summary}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#A7ADB2] leading-relaxed bg-[#171B1F] p-3.5 rounded-xl border border-[#30383F]">
                <strong className="text-[#F4F1EA] font-medium">Trajectory synthesis:</strong> {data.trendComparison.trajectoryExplanation}
              </p>
            </section>
          )}

          {/* SECTION 5: AI Reflection & Companion Synthesis */}
          {data.aiReflection && (
            <section className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 border-b border-[#30383F] pb-4">
                <Sparkles className="w-4 h-4 text-[#4FA3D1]" />
                <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                  Reflective Observations
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#A7ADB2] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>Key Observations</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-[#A7ADB2]">
                    {data.aiReflection.observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4FA3D1] mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#A7ADB2] uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>Patterns Noticed</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-[#A7ADB2]">
                    {data.aiReflection.patternsNoticed.map((pat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{pat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {data.aiReflection.encouragement && (
                <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 text-xs text-[#F4F1EA] leading-relaxed italic">
                  "{data.aiReflection.encouragement}"
                </div>
              )}
            </section>
          )}

          {/* SECTION 6: Gentle Actionable Suggestions */}
          {data.actionableSuggestions && data.actionableSuggestions.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[#30383F]">
                <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                  Gentle Explorations
                </h2>
                <span className="text-xs text-[#747C82]">Micro-adjustments for mindful balance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.actionableSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-[#1D2328] border border-[#30383F] rounded-xl p-4 space-y-2 flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-lg bg-[#171B1F] border border-[#30383F] shrink-0 mt-0.5">
                      {getCategoryIcon(sug.category)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-[#F4F1EA]">{sug.title}</h4>
                      <p className="text-xs text-[#A7ADB2] leading-relaxed">{sug.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Verification & Privacy Footer */}
          <div className="text-center pt-2 pb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171B1F] border border-[#30383F] text-[#747C82] text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Isolated to {user.email || user.uid}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

