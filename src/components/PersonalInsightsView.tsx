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

  // Semantic mood styling helper
  const getMoodBadge = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'peaceful':
        return { 
          emoji: '🌿', 
          label: 'Peaceful', 
          color: 'bg-[#16271F] text-[#34D399] border-[#34D399]/25', 
          bar: 'bg-[#34D399]' 
        };
      case 'energized':
        return { 
          emoji: '⚡', 
          label: 'Energized', 
          color: 'bg-[#2A2315] text-[#FBBF24] border-[#FBBF24]/25', 
          bar: 'bg-[#FBBF24]' 
        };
      case 'motivated':
        return { 
          emoji: '🔥', 
          label: 'Motivated', 
          color: 'bg-[#3282B8]/15 text-[#4FA3D1] border-[#3282B8]/30', 
          bar: 'bg-[#4FA3D1]' 
        };
      case 'anxious':
        return { 
          emoji: '🌧️', 
          label: 'Anxious', 
          color: 'bg-[#2A2315] text-[#FBBF24] border-[#FBBF24]/25', 
          bar: 'bg-[#FBBF24]' 
        };
      case 'overwhelmed':
        return { 
          emoji: '🌊', 
          label: 'Overwhelmed', 
          color: 'bg-[#2D1B1B] text-[#F87171] border-[#F87171]/25', 
          bar: 'bg-[#F87171]' 
        };
      case 'thoughtful':
      default:
        return { 
          emoji: '🤔', 
          label: (mood || 'Thoughtful').charAt(0).toUpperCase() + (mood || 'Thoughtful').slice(1).toLowerCase(), 
          color: 'bg-[#201A30] text-[#A78BFA] border-[#A78BFA]/25', 
          bar: 'bg-[#A78BFA]' 
        };
    }
  };

  // State 1: Insufficient Data (< 2 entries)
  if (entries.length < 2) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full py-10">
        <div 
          id="personal-insights-insufficient-data"
          className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-8 sm:p-12 text-center shadow-xs relative"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#F4F1EA] mb-2 tracking-tight">
            More Journal Entries Needed
          </h2>

          <p className="text-sm text-[#A7ADB2] max-w-md mx-auto mb-6 leading-relaxed">
            Personal Insights analyzes patterns across your writing, emotional trajectory, and recurring themes. You currently have <span className="font-semibold text-[#F4F1EA]">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>. At least <strong className="text-[#F4F1EA]">2 reflections</strong> are required to identify meaningful patterns.
          </p>

          <div className="p-4 bg-[#171B1F] border border-[#30383F] rounded-xl max-w-md mx-auto mb-8 text-left space-y-2.5">
            <div className="text-xs font-semibold text-[#F4F1EA] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#4FA3D1]" />
              <span>What Personal Insights will reveal:</span>
            </div>
            <ul className="text-xs text-[#A7ADB2] space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Recurring topics and themes across your reflections</li>
              <li>Emotional shifts and mood progression over time</li>
              <li>How you navigate challenges and build resilience</li>
              <li>Actionable observations grounded in your authentic writing</li>
            </ul>
          </div>

          <button
            id="insights-new-entry-cta"
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3282B8] hover:bg-[#4FA3D1] text-white font-semibold text-sm rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
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
      <div className="flex-1 max-w-5xl mx-auto w-full py-10 space-y-6">
        <div className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#30383F] border-t-[#4FA3D1] animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-[#F4F1EA]">Analyzing Journal Patterns</h3>
            <p className="text-xs text-[#A7ADB2] mt-1">
              Reflecting on your {entries.length} entries to uncover themes, emotional progression, and key observations...
            </p>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-44 bg-[#1D2328] border border-[#30383F] rounded-2xl" />
          <div className="h-44 bg-[#1D2328] border border-[#30383F] rounded-2xl" />
          <div className="h-56 bg-[#1D2328] border border-[#30383F] rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  // State 3: Error State
  if (errorMessage && !insights) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full py-10">
        <div className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#171B1F] border border-[#30383F] text-[#A7ADB2] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-[#A7ADB2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F4F1EA]">Unable to Load Insights</h3>
            <p className="text-xs text-[#A7ADB2] mt-1 max-w-md mx-auto">{errorMessage}</p>
          </div>
          <button
            onClick={() => loadInsights(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#171B1F] hover:bg-[#252C32] text-[#F4F1EA] text-xs font-semibold rounded-xl border border-[#30383F] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4FA3D1]" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const dominantMoodBadge = getMoodBadge(insights.moodAnalysis.dominantMood);

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full py-6 space-y-8">
      {/* Top Header & Trust Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#30383F]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] tracking-tight">
              Personal Insights
            </h1>
            <span className="text-xs font-medium bg-[#171B1F] text-[#A7ADB2] px-2.5 py-1 rounded-full border border-[#30383F]">
              {insights.entryCountAnalyzed} {insights.entryCountAnalyzed === 1 ? 'entry' : 'entries'} analyzed
            </span>
          </div>
          <p className="text-sm text-[#A7ADB2] mt-1.5">
            Understand patterns emerging from your journal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 text-xs text-[#747C82] bg-[#171B1F] border border-[#30383F] px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Based on your journal entries</span>
          </div>
          <button
            id="regenerate-insights-btn"
            onClick={() => loadInsights(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171B1F] hover:bg-[#252C32] text-[#F4F1EA] text-xs font-medium rounded-xl border border-[#30383F] transition-colors cursor-pointer disabled:opacity-50"
            title="Re-run analysis across your latest entries"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#4FA3D1] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* 1. What Your Journal Is Showing */}
      <section 
        id="insights-ai-summary"
        className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#30383F]">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
              What Your Journal Is Showing
            </h2>
            <p className="text-xs text-[#A7ADB2] mt-0.5">
              AI-generated patterns and observations
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#4FA3D1] bg-[#3282B8]/10 border border-[#3282B8]/30 px-2.5 py-1 rounded-full w-fit">
            Synthesized reflection
          </span>
        </div>

        {/* Synthesis Narrative */}
        <div className="p-5 bg-[#171B1F] border border-[#30383F] rounded-xl text-sm text-[#F4F1EA] leading-relaxed">
          <p className="font-normal leading-relaxed">{insights.aiSummary.synthesis}</p>
        </div>

        {/* Observations List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-[#A7ADB2] tracking-wider uppercase">
            Key Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.aiSummary.observations.map((obs, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-start gap-3 text-xs sm:text-sm text-[#F4F1EA] leading-relaxed"
              >
                <div className="w-5 h-5 rounded-full bg-[#3282B8]/15 border border-[#3282B8]/30 text-[#4FA3D1] flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                  {idx + 1}
                </div>
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Emotional Trajectory & Mood Patterns */}
      <section 
        id="insights-mood-patterns"
        className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-[#30383F]">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
              Emotional Trajectory
            </h2>
            <p className="text-xs text-[#A7ADB2] mt-0.5">
              Mood flow and distribution across your entries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A7ADB2]">Dominant tone:</span>
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize flex items-center gap-1.5 ${dominantMoodBadge.color}`}>
              <span>{dominantMoodBadge.emoji}</span>
              <span>{dominantMoodBadge.label}</span>
            </span>
          </div>
        </div>

        {insights.moodAnalysis.trendDescription && (
          <p className="text-sm text-[#F4F1EA] italic bg-[#171B1F] p-4 rounded-xl border border-[#30383F] border-l-2 border-l-[#A78BFA] leading-relaxed">
            "{insights.moodAnalysis.trendDescription}"
          </p>
        )}

        {/* Recorded Timeline */}
        {insights.moodAnalysis.timeline && insights.moodAnalysis.timeline.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#A7ADB2] tracking-wider uppercase">
              Recorded Timeline ({insights.moodAnalysis.timeline.length} Entries)
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {insights.moodAnalysis.timeline.map((point, i) => {
                const badge = getMoodBadge(point.mood);
                return (
                  <div
                    key={point.id || i}
                    className="min-w-[160px] max-w-[180px] p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex flex-col justify-between shrink-0"
                  >
                    <div>
                      <div className="text-[11px] text-[#747C82] font-mono mb-1">{point.date}</div>
                      <div className="text-xs font-medium text-[#F4F1EA] truncate mb-3" title={point.title}>
                        {point.title}
                      </div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium capitalize inline-flex items-center gap-1.5 w-fit ${badge.color}`}>
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mood Distribution Bars */}
        {insights.moodAnalysis.moodBreakdown && Object.keys(insights.moodAnalysis.moodBreakdown).length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-[#A7ADB2] tracking-wider uppercase">
              Distribution Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(insights.moodAnalysis.moodBreakdown).map(([moodKey, count]) => {
                const total = insights.entryCountAnalyzed || 1;
                const pct = Math.round((count / total) * 100);
                const badge = getMoodBadge(moodKey);
                return (
                  <div key={moodKey} className="p-3 bg-[#171B1F] border border-[#30383F] rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="capitalize text-[#F4F1EA] flex items-center gap-1.5 font-medium">
                        <span>{badge.emoji}</span>
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[#A7ADB2] font-mono text-[11px]">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#252C32] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${badge.bar} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Two Column Section: Recurring Themes & Common Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Recurring Themes */}
        <section 
          id="insights-recurring-themes"
          className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#30383F] pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#A78BFA]" />
                <div>
                  <h2 className="text-base font-semibold text-[#F4F1EA] tracking-tight">Recurring Themes</h2>
                  <p className="text-xs text-[#A7ADB2] mt-0.5">Frequent subjects across reflections</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#A78BFA] bg-[#201A30] border border-[#A78BFA]/25 px-2 py-0.5 rounded-full">
                Long-Term
              </span>
            </div>

            <div className="space-y-3">
              {insights.recurringThemes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl space-y-1"
                >
                  <div className="text-xs font-semibold text-[#F4F1EA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] shrink-0" />
                    <span>{item.theme}</span>
                  </div>
                  <p className="text-xs text-[#A7ADB2] leading-relaxed pl-3.5">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Common Challenges */}
        <section 
          id="insights-common-challenges"
          className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#30383F] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FBBF24]" />
                <div>
                  <h2 className="text-base font-semibold text-[#F4F1EA] tracking-tight">Navigated Challenges</h2>
                  <p className="text-xs text-[#A7ADB2] mt-0.5">Recurring obstacles identified in entries</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#FBBF24] bg-[#2A2315] border border-[#FBBF24]/25 px-2 py-0.5 rounded-full">
                Attention
              </span>
            </div>

            <div className="space-y-3">
              {insights.commonChallenges.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl space-y-1"
                >
                  <div className="text-xs font-semibold text-[#F4F1EA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] shrink-0" />
                    <span>{item.challenge}</span>
                  </div>
                  <p className="text-xs text-[#A7ADB2] leading-relaxed pl-3.5">{item.context}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Two Column Section: Positive Patterns & Suggested Next Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. Positive Patterns & Progress */}
        <section 
          id="insights-positive-patterns"
          className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-7"
        >
          <div className="flex items-center justify-between mb-4 border-b border-[#30383F] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#34D399]" />
              <div>
                <h2 className="text-base font-semibold text-[#F4F1EA] tracking-tight">Positive Patterns</h2>
                <p className="text-xs text-[#A7ADB2] mt-0.5">Constructive habits and milestones</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#34D399] bg-[#16271F] border border-[#34D399]/25 px-2 py-0.5 rounded-full">
              Constructive
            </span>
          </div>

          <div className="space-y-3">
            {insights.positivePatterns.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl space-y-1"
              >
                <div className="text-xs font-semibold text-[#F4F1EA] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>{item.pattern}</span>
                </div>
                <p className="text-xs text-[#A7ADB2] leading-relaxed pl-5.5">{item.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Suggested Next Actions */}
        <section 
          id="insights-next-actions"
          className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-7"
        >
          <div className="flex items-center justify-between mb-4 border-b border-[#30383F] pb-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#4FA3D1]" />
              <div>
                <h2 className="text-base font-semibold text-[#F4F1EA] tracking-tight">Suggested Next Steps</h2>
                <p className="text-xs text-[#A7ADB2] mt-0.5">Gentle actions derived from your thoughts</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#4FA3D1] bg-[#3282B8]/10 border border-[#3282B8]/30 px-2 py-0.5 rounded-full">
              Actionable
            </span>
          </div>

          <div className="space-y-3">
            {insights.suggestedNextActions.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-start gap-3 text-xs sm:text-sm text-[#F4F1EA]"
              >
                <span className="w-5 h-5 rounded-full bg-[#3282B8]/15 border border-[#3282B8]/30 text-[#4FA3D1] font-mono font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
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
