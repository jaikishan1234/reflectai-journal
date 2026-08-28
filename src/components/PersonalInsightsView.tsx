import React, { useState, useEffect } from 'react';
import { JournalEntry, UserProfile, PersonalInsightsData } from '../types';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Smile,
  Target,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Zap,
  Info,
  Clock
} from 'lucide-react';

interface PersonalInsightsViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
}

const INSIGHTS_CACHE_KEY_PREFIX = 'reflectai_insights_cache_';

export const PersonalInsightsView: React.FC<PersonalInsightsViewProps> = ({
  entries,
  user,
  onNewEntry,
}) => {
  const [insights, setInsights] = useState<PersonalInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cacheKey = `${INSIGHTS_CACHE_KEY_PREFIX}${user.uid}`;

  // Fetch or load cached insights
  const loadInsights = async (forceRefresh = false) => {
    if (entries.length < 2) {
      setInsights(null);
      setIsLoading(false);
      return;
    }

    // Check localStorage cache if not forced
    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cachedData: PersonalInsightsData = JSON.parse(cachedRaw);
          // If the cached analysis matches the current entry count, reuse it
          if (cachedData && cachedData.entryCountAnalyzed === entries.length) {
            setInsights(cachedData);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not read cached insights:', e);
      }
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          entries: entries.map(e => ({
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

      const data: PersonalInsightsData = await response.json();
      setInsights(data);

      // Cache safely
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (cacheErr) {
        console.warn('Could not cache insights data:', cacheErr);
      }
    } catch (err: any) {
      console.error('Failed to generate insights:', err);
      setErrorMessage(err.message || 'Unable to generate personal insights. Please verify your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [user.uid, entries.length]);

  // Mood styling helper
  const getMoodBadge = (mood: string) => {
    switch (mood) {
      case 'peaceful':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', emoji: '🌿' };
      case 'energized':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', emoji: '⚡' };
      case 'motivated':
        return { bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30', emoji: '🔥' };
      case 'anxious':
        return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', emoji: '🌧️' };
      case 'overwhelmed':
        return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', emoji: '🌊' };
      case 'thoughtful':
      default:
        return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', emoji: '🤔' };
    }
  };

  // State 1: Insufficient Data (< 2 entries)
  if (entries.length < 2) {
    return (
      <div className="flex-1 max-w-4xl mx-auto w-full py-8">
        <div 
          id="personal-insights-insufficient-data"
          className="bg-stone-900 border border-stone-800 rounded-2xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-100 mb-2">
            More Journal Data Needed
          </h2>

          <p className="text-sm text-stone-400 max-w-md mx-auto mb-6 leading-relaxed">
            Personal Insights analyzes your recurring themes, mood evolution, and positive milestones. You currently have <span className="font-semibold text-amber-400">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>. At least <strong className="text-stone-200">2 reflections</strong> are required to identify meaningful patterns.
          </p>

          <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl max-w-md mx-auto mb-8 text-left space-y-2">
            <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              <span>What Personal Insights will reveal:</span>
            </div>
            <ul className="text-xs text-stone-400 space-y-1.5 list-disc list-inside">
              <li>Recurring topics & themes across all entries</li>
              <li>Mood progression and emotional shifts over time</li>
              <li>Common obstacles and how you navigate them</li>
              <li>Positive habits, resilience milestones & growth</li>
              <li>AI-powered synthesis and practical next steps</li>
            </ul>
          </div>

          <button
            id="insights-new-entry-cta"
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Write a New Reflection</span>
          </button>
        </div>
      </div>
    );
  }

  // State 2: Loading State
  if (isLoading && !insights) {
    return (
      <div className="flex-1 max-w-5xl mx-auto w-full py-8 space-y-6">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-stone-200">Generating Personal Insights</h3>
            <p className="text-xs text-stone-400 mt-1">
              Gemini is analyzing your {entries.length} reflections for themes, mood patterns, and positive growth...
            </p>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-48 bg-stone-900/60 border border-stone-800 rounded-2xl" />
          <div className="h-48 bg-stone-900/60 border border-stone-800 rounded-2xl" />
          <div className="h-64 bg-stone-900/60 border border-stone-800 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  // State 3: Error State
  if (errorMessage && !insights) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full py-8">
        <div className="bg-stone-900 border border-red-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100">Unable to Load Insights</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">{errorMessage}</p>
          </div>
          <button
            onClick={() => loadInsights(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const dominantMoodBadge = getMoodBadge(insights.moodAnalysis.dominantMood);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full py-6 space-y-6">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/80 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-100">Personal Insights</h1>
            <span className="text-[10px] font-medium bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full border border-stone-700">
              {insights.entryCountAnalyzed} {insights.entryCountAnalyzed === 1 ? 'Entry' : 'Entries'} Analyzed
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Grounded behavioral trends, mood progression, and constructive growth patterns from your journal history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {insights.generatedAt && (
            <div className="text-[11px] text-stone-500 flex items-center gap-1 hidden md:flex">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {new Date(insights.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          <button
            id="regenerate-insights-btn"
            onClick={() => loadInsights(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white text-xs font-semibold rounded-xl border border-stone-700 transition-all cursor-pointer disabled:opacity-50"
            title="Re-run Gemini analysis across your latest entries"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* 1. AI Summary Section */}
      <section 
        id="insights-ai-summary"
        className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-stone-100">AI Synthesis & Key Observations</h2>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
            Grounded via Gemini
          </span>
        </div>

        {/* Synthesis Narrative */}
        <div className="p-4 bg-stone-950/70 border border-stone-800/80 rounded-xl mb-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>{insights.aiSummary.synthesis}</p>
        </div>

        {/* Observations List */}
        <div>
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
            Key Grounded Observations:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.aiSummary.observations.map((obs, idx) => (
              <div
                key={idx}
                className="p-3 bg-stone-950/40 border border-stone-800/60 rounded-xl flex items-start gap-2 text-xs text-stone-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Mood Patterns Section */}
      <section 
        id="insights-mood-patterns"
        className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-stone-100">Mood Patterns & Emotional Trajectory</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Dominant Mood:</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize flex items-center gap-1 ${dominantMoodBadge.bg}`}>
              <span>{dominantMoodBadge.emoji}</span>
              <span>{insights.moodAnalysis.dominantMood}</span>
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-300 italic bg-stone-950/40 p-3 rounded-xl border border-stone-800/60">
          "{insights.moodAnalysis.trendDescription}"
        </p>

        {/* Visual Timeline */}
        <div>
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Recorded Timeline ({insights.moodAnalysis.timeline.length} Dates):
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-800">
            {insights.moodAnalysis.timeline.map((point, i) => {
              const badge = getMoodBadge(point.mood);
              return (
                <div
                  key={point.id || i}
                  className="min-w-[140px] max-w-[160px] p-3 bg-stone-950 border border-stone-800 rounded-xl flex flex-col justify-between shrink-0"
                >
                  <div>
                    <div className="text-[10px] text-stone-500 font-medium mb-1">{point.date}</div>
                    <div className="text-xs font-semibold text-stone-200 truncate mb-2" title={point.title}>
                      {point.title}
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium capitalize inline-flex items-center gap-1 w-fit ${badge.bg}`}>
                    <span>{badge.emoji}</span>
                    <span>{point.mood}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Distribution Bars */}
        <div>
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Distribution Breakdown:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(insights.moodAnalysis.moodBreakdown || {}).map(([moodKey, count]) => {
              const total = insights.entryCountAnalyzed || 1;
              const pct = Math.round((count / total) * 100);
              const badge = getMoodBadge(moodKey);
              return (
                <div key={moodKey} className="p-2.5 bg-stone-950/50 border border-stone-800 rounded-xl">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-stone-300 flex items-center gap-1">
                      <span>{badge.emoji}</span>
                      <span>{moodKey}</span>
                    </span>
                    <span className="text-stone-400 font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two Column Grid: Recurring Themes & Common Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Recurring Themes */}
        <section 
          id="insights-recurring-themes"
          className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-stone-100">Recurring Themes</h2>
            </div>

            <div className="space-y-3">
              {insights.recurringThemes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-xl space-y-1 hover:border-stone-700 transition-colors"
                >
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{item.theme}</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Common Challenges */}
        <section 
          id="insights-common-challenges"
          className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm sm:text-base font-bold text-stone-100">Common Challenges</h2>
            </div>

            <div className="space-y-3">
              {insights.commonChallenges.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-xl space-y-1 hover:border-stone-700 transition-colors"
                >
                  <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span>{item.challenge}</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.context}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Two Column Grid: Positive Patterns & Suggested Next Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. Positive Patterns & Progress */}
        <section 
          id="insights-positive-patterns"
          className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
            <Target className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-stone-100">Positive Patterns & Progress</h2>
          </div>

          <div className="space-y-3">
            {insights.positivePatterns.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-stone-950/60 border border-emerald-500/20 rounded-xl space-y-1 hover:border-emerald-500/30 transition-colors"
              >
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{item.pattern}</span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">{item.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Suggested Next Actions */}
        <section 
          id="insights-next-actions"
          className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-stone-100">Suggested Next Actions</h2>
          </div>

          <div className="space-y-3">
            {insights.suggestedNextActions.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-xl flex items-start gap-2.5 text-xs text-stone-300"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
