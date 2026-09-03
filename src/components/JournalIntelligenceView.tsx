import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Smile,
  Compass,
  Tag,
  BookOpen,
  Link2,
  Zap,
  Activity,
  Layers,
  Flame,
  ChevronRight,
  Filter,
  BarChart2,
  Info,
  ShieldCheck,
  Eye,
  X
} from 'lucide-react';
import {
  JournalEntry,
  UserProfile,
  TimeRangeFilter,
  JournalIntelligenceData,
  IntelligenceSupportingEntry,
  IntelligenceTopic,
  IntelligencePattern,
  BehavioralPattern,
  GrowthComparison,
  EntryConnection,
  LongTermInsight
} from '../types';

interface JournalIntelligenceViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

const TIME_RANGES: { id: TimeRangeFilter; label: string; shortLabel: string }[] = [
  { id: '7d', label: 'Last 7 Days', shortLabel: '7D' },
  { id: '30d', label: 'Last 30 Days', shortLabel: '30D' },
  { id: '90d', label: 'Last 90 Days', shortLabel: '90D' },
  { id: '1y', label: 'Last Year', shortLabel: '1Y' },
  { id: 'all', label: 'All Time', shortLabel: 'All' },
];

const MOOD_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  peaceful: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Peaceful' },
  energized: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400', label: 'Energized' },
  thoughtful: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400', label: 'Thoughtful' },
  motivated: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400', label: 'Motivated' },
  anxious: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400', label: 'Anxious' },
  overwhelmed: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400', label: 'Overwhelmed' },
};

const INSIGHT_CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  mindset: { label: 'Mindset & Clarity', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  energy: { label: 'Energy & Recovery', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  productivity: { label: 'Focus & Execution', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  values: { label: 'Values & Purpose', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  growth: { label: 'Personal Evolution', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
};

export const JournalIntelligenceView: React.FC<JournalIntelligenceViewProps> = ({
  entries,
  user,
  onNewEntry,
  onSelectEntry,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeFilter>('30d');
  const [intelligenceData, setIntelligenceData] = useState<JournalIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inspectingEntry, setInspectingEntry] = useState<JournalEntry | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Filter entries to currently authenticated user
  const userEntries = entries
    .filter((e) => e.userId === user.uid)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  const cacheKey = `reflectai_intelligence_${user.uid}_${selectedRange}`;

  const fetchIntelligence = async (forceRefresh = false) => {
    setError(null);

    // Calculate cutoff for current range
    const now = Date.now();
    const cutoffs: Record<TimeRangeFilter, number> = {
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
      '90d': now - 90 * 24 * 60 * 60 * 1000,
      '1y': now - 365 * 24 * 60 * 60 * 1000,
      'all': 0,
    };
    const cutoff = cutoffs[selectedRange] || 0;
    const filteredEntries = userEntries.filter(
      (e) => new Date(e.createdAt || 0).getTime() >= cutoff
    );

    if (filteredEntries.length < 2) {
      // Not enough entries in this specific timeframe
      try {
        const response = await fetch('/api/gemini/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            timeRange: selectedRange,
            totalAvailableEntries: userEntries.length,
            entries: filteredEntries.map((e) => ({
              id: e.id,
              title: e.title,
              content: e.content,
              mood: e.mood,
              tags: e.tags,
              createdAt: e.createdAt,
            })),
          }),
        });
        if (response.ok) {
          const data: JournalIntelligenceData = await response.json();
          setIntelligenceData(data);
        }
      } catch (err) {
        console.error('Error getting base stats:', err);
      }
      setIsLoading(false);
      return;
    }

    // Check local storage cache if not forced
    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cachedData: JournalIntelligenceData = JSON.parse(cachedRaw);
          if (
            cachedData &&
            cachedData.analyzedEntryCount === filteredEntries.length &&
            cachedData.timeRange === selectedRange
          ) {
            setIntelligenceData(cachedData);
            return;
          }
        }
      } catch (e) {
        console.warn('Cache read error:', e);
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          timeRange: selectedRange,
          totalAvailableEntries: userEntries.length,
          entries: filteredEntries.map((e) => ({
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
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: JournalIntelligenceData = await response.json();
      setIntelligenceData(data);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (cacheErr) {
        console.warn('Cache save warning:', cacheErr);
      }
    } catch (err: any) {
      console.error('Error fetching intelligence:', err);
      setError(err?.message || 'Unable to analyze journal intelligence at this moment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence(false);
  }, [selectedRange, userEntries.length]);

  const handleOpenSupportingEntry = (supporting: IntelligenceSupportingEntry) => {
    const fullEntry = userEntries.find((e) => e.id === supporting.entryId);
    if (fullEntry) {
      onSelectEntry(fullEntry);
    } else {
      // Find by title or approximate match if ID changed
      const matchByTitle = userEntries.find((e) => e.title === supporting.entryTitle);
      if (matchByTitle) {
        onSelectEntry(matchByTitle);
      } else {
        // Show lightweight preview
        setInspectingEntry({
          id: supporting.entryId,
          userId: user.uid,
          title: supporting.entryTitle,
          content: supporting.excerpt,
          mood: (supporting.mood as any) || 'thoughtful',
          tags: supporting.tags || [],
          mode: 'reflect',
          messages: [],
          createdAt: supporting.date,
          updatedAt: supporting.date,
        });
      }
    }
  };

  const activeTopic = intelligenceData?.recurringTopics.find(
    (t) => t.id === selectedTopicId
  ) || intelligenceData?.recurringTopics[0];

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header & Controls */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Brain className="w-4 h-4" />
              <span>Deeper Journal Intelligence</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                Feature 8
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
              Journal Intelligence Dashboard
            </h1>
            <p className="text-sm text-stone-400 max-w-2xl mt-1.5 leading-relaxed">
              Synthesizing long-term patterns, mood evolutions, recurring themes, and deep connections grounded in your authentic reflections over time.
            </p>
          </div>

          {/* Time Range Selector & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Time Range Pills */}
            <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  id={`intelligence-range-${range.id}`}
                  onClick={() => setSelectedRange(range.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedRange === range.id
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title={range.label}
                >
                  <span className="hidden sm:inline">{range.label}</span>
                  <span className="sm:hidden">{range.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              id="intelligence-refresh-btn"
              onClick={() => fetchIntelligence(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border border-stone-700/60 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Refresh intelligence analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {intelligenceData && (
          <div className="mt-6 pt-4 border-t border-stone-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Analyzed <strong className="text-stone-200">{intelligenceData.analyzedEntryCount}</strong> of{' '}
                  <strong className="text-stone-200">{intelligenceData.totalAvailableEntries}</strong> total reflections
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-500 hidden sm:flex">
                <span>•</span>
                <span>Timeframe: <strong className="text-stone-300">{TIME_RANGES.find(r => r.id === selectedRange)?.label}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-500 hidden md:flex">
                <span>•</span>
                <span className="font-mono text-[11px] text-stone-400">Engine: {intelligenceData.modelUsed}</span>
              </div>
            </div>

            <div className="text-[11px] text-stone-500">
              Updated {new Date(intelligenceData.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Analysis Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchIntelligence(true)}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-200 font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Insufficient Entries State */}
      {intelligenceData && !intelligenceData.hasSufficientHistory && (
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-900/60 border border-stone-800 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <Brain className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-stone-100">More Reflections Needed in this Timeframe</h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mt-2 leading-relaxed">
            Deeper Journal Intelligence identifies longitudinal patterns, behavioral habits, and growth trajectories by comparing multiple reflections across time.
            You currently have <strong className="text-stone-200">{intelligenceData.analyzedEntryCount}</strong> entry in the{' '}
            <strong>{TIME_RANGES.find(r => r.id === selectedRange)?.label}</strong> timeframe.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setSelectedRange('all')}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Switch to All Time ({userEntries.length} entries)</span>
            </button>
            <button
              onClick={onNewEntry}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Write a New Reflection</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !intelligenceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-stone-900/60 border border-stone-800 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-stone-900/60 border border-stone-800 animate-pulse" />
          <div className="h-80 rounded-3xl bg-stone-900/60 border border-stone-800 animate-pulse" />
        </div>
      )}

      {/* Main Intelligence Content */}
      {intelligenceData && intelligenceData.hasSufficientHistory && (
        <div className="space-y-8">
          {/* SECTION 1: ACTIVITY & CADENCE METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Volume */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                <span>Reflections Analyzed</span>
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-100">
                  {intelligenceData.activityStats.totalEntriesInPeriod}
                </span>
                <span className="text-xs text-stone-400">
                  / {intelligenceData.activityStats.totalEntriesAllTime} all-time
                </span>
              </div>
              <div className="mt-2 text-[11px] text-stone-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-500" />
                <span>Across {intelligenceData.activityStats.activeDaysCount} active writing days</span>
              </div>
            </div>

            {/* Metric 2: Writing Cadence */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                <span>Writing Frequency</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-100">
                  {intelligenceData.activityStats.entriesPerWeek}
                </span>
                <span className="text-xs text-stone-400">entries / week</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400/90 font-medium truncate" title={intelligenceData.activityStats.writingCadenceDescription}>
                {intelligenceData.activityStats.writingCadenceDescription}
              </div>
            </div>

            {/* Metric 3: Writing Rhythm & Gaps */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                <span>Writing Interval</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-100">
                  {intelligenceData.activityStats.shortestWritingGapDays}–{intelligenceData.activityStats.longestWritingGapDays}
                </span>
                <span className="text-xs text-stone-400">days gap</span>
              </div>
              <div className="mt-2 text-[11px] text-stone-400">
                Avg. ~{intelligenceData.activityStats.averageWordsPerEntry} words per entry
              </div>
            </div>

            {/* Metric 4: Dominant Mood Direction */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
                <span>Emotional Baseline</span>
                <Smile className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold capitalize text-stone-100">
                  {intelligenceData.moodTrends.dominantMood}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                  intelligenceData.moodTrends.direction === 'improving'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : intelligenceData.moodTrends.direction === 'declining'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : intelligenceData.moodTrends.direction === 'fluctuating'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-stone-800 text-stone-300 border border-stone-700'
                }`}>
                  {intelligenceData.moodTrends.direction}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-stone-400 truncate" title={intelligenceData.moodTrends.directionNarrative}>
                {intelligenceData.moodTrends.directionNarrative}
              </div>
            </div>
          </div>

          {/* SECTION 2: MOOD TRENDS & TIMELINE */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Mood Trends & Trajectory</span>
                </div>
                <h2 className="text-xl font-bold text-stone-100 mt-1">Emotional Flow Over Time</h2>
              </div>
              <div className="px-3.5 py-1.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-300">
                {intelligenceData.moodTrends.directionNarrative}
              </div>
            </div>

            {/* Mood Distribution Bar Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {Object.entries(MOOD_COLORS).map(([moodKey, config]) => {
                const count = intelligenceData.moodTrends.moodDistribution[moodKey] || 0;
                const total = intelligenceData.moodTrends.totalLoggedMoods || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div
                    key={moodKey}
                    className={`p-3.5 rounded-xl border ${config.border} ${config.bg} flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold capitalize ${config.text}`}>
                        {config.label}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xl font-bold text-stone-100">{count}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{percentage}%</span>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="w-full bg-stone-950/50 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full ${config.dot}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Mood Timeline Strip */}
            {intelligenceData.moodTrends.timeline.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-stone-400 mb-3 flex items-center justify-between">
                  <span>Chronological Reflection Sequence</span>
                  <span className="text-[10px] text-stone-500">Click any dot to preview reflection</span>
                </div>
                <div className="p-4 bg-stone-950/70 border border-stone-800/80 rounded-2xl overflow-x-auto">
                  <div className="flex items-center gap-3 min-w-max py-2">
                    {intelligenceData.moodTrends.timeline.map((item, idx) => {
                      const moodStyle = MOOD_COLORS[item.mood] || MOOD_COLORS.thoughtful;
                      return (
                        <div
                          key={`${item.entryId}_${idx}`}
                          onClick={() => {
                            const entry = userEntries.find(e => e.id === item.entryId);
                            if (entry) handleOpenSupportingEntry({
                              entryId: entry.id,
                              entryTitle: entry.title,
                              date: entry.createdAt,
                              excerpt: entry.content.slice(0, 140),
                              mood: entry.mood,
                            });
                          }}
                          className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border ${moodStyle.border} ${moodStyle.bg} hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105`}
                          title={`"${item.entryTitle}" - ${item.dateFormatted} (${item.mood})`}
                        >
                          <div className={`w-3 h-3 rounded-full ${moodStyle.dot} group-hover:ring-2 group-hover:ring-amber-400`} />
                          <span className="text-[10px] text-stone-300 font-mono">{item.dateFormatted}</span>
                          <span className="text-[9px] text-stone-400 max-w-[80px] truncate">{item.entryTitle}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: AI-GENERATED LONG-TERM INSIGHTS */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grounded Syntheses</span>
                </div>
                <h2 className="text-xl font-bold text-stone-100 mt-1">AI-Generated Long-Term Insights</h2>
                <p className="text-xs text-stone-400 mt-1">
                  High-signal observations derived from continuous reflection analysis, anchored directly in supporting entries.
                </p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium hidden sm:inline">
                {intelligenceData.longTermInsights.length} Key Insights
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {intelligenceData.longTermInsights.map((insight, idx) => {
                const categoryBadge = INSIGHT_CATEGORY_BADGES[insight.category] || {
                  label: 'General Insight',
                  color: 'bg-stone-800 text-stone-300 border-stone-700',
                };

                return (
                  <div
                    key={insight.id || `insight_${idx}`}
                    className="p-6 rounded-2xl bg-stone-950/70 border border-stone-800/90 flex flex-col justify-between hover:border-stone-700 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${categoryBadge.color}`}>
                          {categoryBadge.label}
                        </span>
                        {insight.timeframeNotes && (
                          <span className="text-[10px] text-stone-500">{insight.timeframeNotes}</span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-stone-100 leading-snug group-hover:text-amber-300 transition-colors">
                        {insight.title}
                      </h3>

                      <p className="text-xs text-stone-300 mt-2.5 leading-relaxed">
                        {insight.explanation}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-800/80">
                      <div className="p-3 bg-stone-900/90 border border-stone-800 rounded-xl mb-3">
                        <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>Actionable Takeaway</span>
                        </div>
                        <p className="text-xs text-stone-200 leading-relaxed font-medium">
                          {insight.takeaway}
                        </p>
                      </div>

                      {/* Supporting Evidence Chips */}
                      {insight.supportingEntries && insight.supportingEntries.length > 0 && (
                        <div>
                          <div className="text-[10px] text-stone-500 mb-1.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Supporting Evidence ({insight.supportingEntries.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {insight.supportingEntries.map((sup, sIdx) => (
                              <button
                                key={`${sup.entryId}_${sIdx}`}
                                onClick={() => handleOpenSupportingEntry(sup)}
                                className="flex items-center gap-1 text-[10px] bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-stone-700 px-2 py-1 rounded-lg transition-colors cursor-pointer truncate max-w-full"
                                title={`Open "${sup.entryTitle}"`}
                              >
                                <span className="font-mono text-stone-400">{sup.dateFormatted || sup.date}</span>
                                <span className="text-stone-400">·</span>
                                <span className="truncate">{sup.entryTitle}</span>
                                <ChevronRight className="w-2.5 h-2.5 text-stone-500 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: RECURRING TOPICS & THEMES */}
          {intelligenceData.recurringTopics.length > 0 && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    <span>User-Derived Themes</span>
                  </div>
                  <h2 className="text-xl font-bold text-stone-100 mt-1">Recurring Topics & Focal Points</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Authentic topics organically extracted from your journal entries rather than predetermined templates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Topic Selector List */}
                <div className="space-y-2 lg:col-span-1">
                  {intelligenceData.recurringTopics.map((topic) => {
                    const isSelected = (activeTopic?.id === topic.id);
                    return (
                      <div
                        key={topic.id}
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-stone-800/90 border-amber-500/40 shadow-lg'
                            : 'bg-stone-950/60 border-stone-800/80 hover:bg-stone-800/50 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-800 text-stone-300'
                          }`}>
                            #{topic.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-stone-100">{topic.name}</h4>
                            <p className="text-[10px] text-stone-400">Last seen: {topic.recentAppearanceDate}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-stone-800 text-stone-400'
                        }`}>
                          {topic.count} {topic.count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Active Topic Deep Dive */}
                {activeTopic && (
                  <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-stone-100">{activeTopic.name}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            {activeTopic.count} Occurrences
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">Recent: {activeTopic.recentAppearanceDate}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
                        {activeTopic.description}
                      </p>

                      <div className="text-xs font-semibold text-stone-400 mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Representative Journal Entries:</span>
                      </div>

                      <div className="space-y-3">
                        {activeTopic.supportingEntries.map((sup, idx) => (
                          <div
                            key={`${sup.entryId}_${idx}`}
                            className="p-4 rounded-xl bg-stone-900/80 border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-stone-700 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mb-1">
                                <span>{sup.dateFormatted || sup.date}</span>
                                {sup.mood && (
                                  <span className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 capitalize text-[10px]">
                                    {sup.mood}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-stone-200 truncate">{sup.entryTitle}</h5>
                              <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 italic">
                                "{sup.excerpt}"
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenSupportingEntry(sup)}
                              className="self-start sm:self-center px-3 py-1.5 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <span>Open Entry</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: RECURRING & BEHAVIORAL PATTERNS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: Recurring Patterns */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Situational Patterns</span>
                </div>
                <h2 className="text-xl font-bold text-stone-100">Recurring Situations & Themes</h2>
                <p className="text-xs text-stone-400 mt-1 mb-6">
                  Observations on recurring contexts, situations, or routines grounded in your journal text.
                </p>

                <div className="space-y-4">
                  {intelligenceData.recurringPatterns.map((pat, idx) => (
                    <div
                      key={pat.id || `pat_${idx}`}
                      className="p-5 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-200">{pat.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono capitalize">
                          {pat.patternType}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{pat.observation}</p>
                      <p className="text-[11px] text-stone-400 bg-stone-900/70 p-2.5 rounded-xl border border-stone-800/60">
                        <strong className="text-stone-300">Journal Evidence:</strong> {pat.evidenceExplanation}
                      </p>

                      {pat.supportingEntries && pat.supportingEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {pat.supportingEntries.map((sup, sIdx) => (
                            <button
                              key={`${sup.entryId}_${sIdx}`}
                              onClick={() => handleOpenSupportingEntry(sup)}
                              className="text-[10px] bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <BookOpen className="w-2.5 h-2.5 text-stone-500" />
                              <span className="truncate max-w-[150px]">{sup.entryTitle}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column B: Behavioral Patterns */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Self-Described Habits</span>
                </div>
                <h2 className="text-xl font-bold text-stone-100">Behavioral Patterns & Routines</h2>
                <p className="text-xs text-stone-400 mt-1 mb-6">
                  Patterns in how you plan, execute, and decompress as described in your writing (strictly non-clinical).
                </p>

                <div className="space-y-4">
                  {intelligenceData.behavioralPatterns.map((beh, idx) => (
                    <div
                      key={beh.id || `beh_${idx}`}
                      className="p-5 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-200">{beh.behaviorTitle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono capitalize">
                          {beh.category}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{beh.description}</p>
                      <p className="text-[11px] text-stone-400 bg-stone-900/70 p-2.5 rounded-xl border border-stone-800/60">
                        <strong className="text-emerald-400/90">Manifestation:</strong> {beh.manifestation}
                      </p>

                      {beh.supportingEntries && beh.supportingEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {beh.supportingEntries.map((sup, sIdx) => (
                            <button
                              key={`${sup.entryId}_${sIdx}`}
                              onClick={() => handleOpenSupportingEntry(sup)}
                              className="text-[10px] bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <BookOpen className="w-2.5 h-2.5 text-stone-500" />
                              <span className="truncate max-w-[150px]">{sup.entryTitle}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: PERSONAL GROWTH / CHANGE OVER TIME */}
          {intelligenceData.personalGrowth.length > 0 && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Evolutionary Comparison</span>
                  </div>
                  <h2 className="text-xl font-bold text-stone-100 mt-1">Personal Growth & Trajectory</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Contrasting earlier reflections with recent entries across key dimensions of self-development.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {intelligenceData.personalGrowth.map((growth, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-stone-950/70 border border-stone-800/90 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                        <span>{growth.dimension}</span>
                      </h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold uppercase tracking-wider">
                        {growth.trendType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Earlier Phase */}
                      <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800">
                        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>Earlier Reflections</span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed mb-3">
                          {growth.earlierSummary}
                        </p>
                        {growth.earlierEvidence && growth.earlierEvidence.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {growth.earlierEvidence.map((sup, sIdx) => (
                              <button
                                key={`earlier_${sIdx}`}
                                onClick={() => handleOpenSupportingEntry(sup)}
                                className="text-[9px] bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800 px-2 py-0.5 rounded cursor-pointer truncate max-w-full"
                              >
                                {sup.entryTitle} ({sup.dateFormatted || sup.date})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recent Phase */}
                      <div className="p-4 rounded-xl bg-stone-900/90 border border-amber-500/20 bg-amber-500/5">
                        <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Recent Reflections</span>
                        </div>
                        <p className="text-xs text-stone-200 leading-relaxed mb-3 font-medium">
                          {growth.recentSummary}
                        </p>
                        {growth.recentEvidence && growth.recentEvidence.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {growth.recentEvidence.map((sup, sIdx) => (
                              <button
                                key={`recent_${sIdx}`}
                                onClick={() => handleOpenSupportingEntry(sup)}
                                className="text-[9px] bg-stone-950 text-amber-300 hover:text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded cursor-pointer truncate max-w-full"
                              >
                                {sup.entryTitle} ({sup.dateFormatted || sup.date})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: CROSS-ENTRY CONNECTIONS */}
          {intelligenceData.connections.length > 0 && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Relational Synthesis</span>
                  </div>
                  <h2 className="text-xl font-bold text-stone-100 mt-1">Meaningful Connections Across Entries</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Discovering how earlier goals, challenges, or thoughts developed into later reflections.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {intelligenceData.connections.map((conn, idx) => (
                  <div
                    key={conn.id || `conn_${idx}`}
                    className="p-6 rounded-2xl bg-stone-950/70 border border-stone-800/90 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-100">{conn.connectionHeadline}</h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono capitalize shrink-0">
                        {conn.relationshipType.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/80">
                      {conn.narrative}
                    </p>

                    {/* Dual Connected Entry Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Entry A */}
                      <div
                        onClick={() => handleOpenSupportingEntry(conn.entryA)}
                        className="p-3.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1">
                          <span>Origin: {conn.entryA.dateFormatted || conn.entryA.date}</span>
                          <Eye className="w-3 h-3 text-stone-500 group-hover:text-amber-400" />
                        </div>
                        <h5 className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors truncate">
                          {conn.entryA.entryTitle}
                        </h5>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 italic">
                          "{conn.entryA.excerpt}"
                        </p>
                      </div>

                      {/* Entry B */}
                      <div
                        onClick={() => handleOpenSupportingEntry(conn.entryB)}
                        className="p-3.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1">
                          <span>Development: {conn.entryB.dateFormatted || conn.entryB.date}</span>
                          <Eye className="w-3 h-3 text-stone-500 group-hover:text-amber-400" />
                        </div>
                        <h5 className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors truncate">
                          {conn.entryB.entryTitle}
                        </h5>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 italic">
                          "{conn.entryB.excerpt}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry Inspection Modal */}
      {inspectingEntry && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setInspectingEntry(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(inspectingEntry.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {inspectingEntry.mood && (
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 capitalize text-[10px]">
                  {inspectingEntry.mood}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-stone-100 mb-3">{inspectingEntry.title || 'Untitled Entry'}</h3>

            <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-2xl max-h-60 overflow-y-auto mb-6 text-xs text-stone-300 whitespace-pre-wrap leading-relaxed">
              {inspectingEntry.content}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setInspectingEntry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectEntry(inspectingEntry);
                  setInspectingEntry(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open in Journal Editor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
