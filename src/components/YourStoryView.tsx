import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Milestone,
  History,
  Compass,
  Tag,
  Smile,
  ChevronRight
} from 'lucide-react';
import { JournalEntry, UserProfile, YourStoryResponse } from '../types';

interface YourStoryViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
}

export const YourStoryView: React.FC<YourStoryViewProps> = ({
  entries,
  user,
  onNewEntry,
}) => {
  const [storyData, setStoryData] = useState<YourStoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedHash, setLastAnalyzedHash] = useState<string>('');

  // Filter entries to currently authenticated user and sort chronologically (earliest to latest)
  const userEntries = entries
    .filter((e) => e.userId === user.uid)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // Generate a hash representing the current set of entries for smart caching
  const currentEntriesHash = `${user.uid}_${userEntries.length}_${userEntries.map(e => e.id + (e.updatedAt || e.createdAt)).join('_')}`;

  const fetchYourStory = async (forceRefresh: boolean = false) => {
    if (userEntries.length < 2) {
      setStoryData({
        summary: 'More reflections across different points in time are needed to identify meaningful changes or transitions over time.',
        changes: [],
        hasSufficientContext: false,
        analyzedEntryCount: userEntries.length,
        timestamp: new Date().toISOString(),
        modelUsed: 'deterministic-temporal-guard',
      });
      setIsLoading(false);
      return;
    }

    if (!forceRefresh && lastAnalyzedHash === currentEntriesHash && storyData) {
      // Use cached analysis
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/your-story', {
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
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: YourStoryResponse = await response.json();
      setStoryData(data);
      setLastAnalyzedHash(currentEntriesHash);
    } catch (err: any) {
      console.error('Error analyzing Your Story:', err);
      setError(err?.message || 'Failed to analyze your story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount or when entries change
  useEffect(() => {
    fetchYourStory();
  }, [currentEntriesHash]);

  // Render mood badge with distinct color
  const getMoodBadge = (mood: string) => {
    switch (mood) {
      case 'calm':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Calm</span>;
      case 'focused':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Focused</span>;
      case 'grateful':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Grateful</span>;
      case 'anxious':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Anxious</span>;
      case 'creative':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Creative</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-700/50 text-stone-300 border border-stone-600/50">{mood || 'Thoughtful'}</span>;
    }
  };

  // If user has zero entries
  if (userEntries.length === 0) {
    return (
      <div id="story-empty-state" className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-inner">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-100 mb-2 tracking-tight">Your Story</h2>
        <p className="text-sm text-stone-400 mb-6 max-w-md leading-relaxed">
          Your Story analyzes how your thoughts, habits, challenges, and progress evolve over time. Once you begin recording reflections in your journal, your chronological journey will appear here.
        </p>
        <button
          id="story-empty-new-entry-btn"
          onClick={onNewEntry}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Write Your First Reflection</span>
        </button>
      </div>
    );
  }

  return (
    <div id="story-container" className="flex-1 flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="bg-stone-900/80 border border-stone-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Compass className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">Your Story</h1>
              <span className="text-[11px] font-medium bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-full">
                Chronological Analysis
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
              Understand how your thoughts, habits, challenges, and progress have changed over time across your {userEntries.length} chronological journal {userEntries.length === 1 ? 'reflection' : 'reflections'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="story-refresh-btn"
              onClick={() => fetchYourStory(true)}
              disabled={isLoading || userEntries.length < 2}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLoading || userEntries.length < 2
                  ? 'bg-stone-800/50 text-stone-500 border-stone-800 cursor-not-allowed'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700 hover:text-amber-400 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isLoading ? 'Analyzing Story...' : 'Re-analyze Story'}</span>
            </button>
          </div>
        </div>

        {/* Security & Verification Guarantee */}
        <div className="mt-4 pt-4 border-t border-stone-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict User Data Isolation ({user.email})</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Model: <strong className="text-stone-400 font-mono">{storyData?.modelUsed || 'gemini-3.6-flash'}</strong></span>
            {storyData?.timestamp && (
              <span>Updated: <strong className="text-stone-400">{new Date(storyData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message if any */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchYourStory(true)}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Insufficient Entries Notice (If only 1 entry) */}
      {userEntries.length === 1 && (
        <div id="story-insufficient-notice" className="p-5 bg-stone-900/60 border border-stone-800 rounded-2xl flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Milestone className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-stone-200 mb-1">Single Reflection in Context</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              You have 1 saved reflection so far. To detect transitions and identify how your routines, challenges, or thoughts change over time, at least 2 entries across different points in time are needed.
            </p>
            <button
              onClick={onNewEntry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-lg transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Write Next Reflection</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Change-Over-Time Analysis Cards */}
      {isLoading ? (
        <div className="p-8 bg-stone-900/40 border border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <h3 className="text-sm font-semibold text-stone-200">Analyzing Your Chronological Timeline</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm">
            Comparing earlier vs recent reflections for documented shifts in habits, challenges, and routines...
          </p>
        </div>
      ) : storyData && (
        <div className="flex flex-col gap-6">
          {/* High-Level Journey Summary */}
          <div id="story-summary-card" className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-300">Journey Summary</h2>
            </div>
            <p className="text-sm text-stone-200 leading-relaxed">
              {storyData.summary}
            </p>
          </div>

          {/* Detected Meaningful Changes */}
          {storyData.hasSufficientContext && storyData.changes.length > 0 ? (
            <div id="story-changes-list" className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Documented Changes Over Time ({storyData.changes.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {storyData.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm"
                  >
                    <div>
                      <h4 className="text-base font-bold text-stone-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{change.title}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed pl-8">
                        {change.description}
                      </p>
                    </div>

                    {/* Grounded Evidence Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 pl-0 sm:pl-8">
                      {/* Earlier Evidence Column */}
                      <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-4 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 pb-2 border-b border-stone-800">
                          <span className="text-amber-400/90 font-medium">Earlier Phase Evidence</span>
                          <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-400">Baseline</span>
                        </div>
                        {change.earlierEvidence.map((ev, evIdx) => (
                          <div key={evIdx} className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between text-[11px] text-stone-300 font-medium">
                              <span className="truncate max-w-[200px]">"{ev.entryTitle}"</span>
                              <span className="text-stone-400 font-mono text-[10px]">{ev.date}</span>
                            </div>
                            <blockquote className="pl-2.5 border-l-2 border-amber-500/40 text-stone-400 italic text-[11px] leading-relaxed">
                              "{ev.excerpt}"
                            </blockquote>
                          </div>
                        ))}
                      </div>

                      {/* Recent Evidence Column */}
                      <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-4 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 pb-2 border-b border-stone-800">
                          <span className="text-emerald-400 font-medium">Recent Phase Evidence</span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Evolution</span>
                        </div>
                        {change.recentEvidence.map((ev, evIdx) => (
                          <div key={evIdx} className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between text-[11px] text-stone-300 font-medium">
                              <span className="truncate max-w-[200px]">"{ev.entryTitle}"</span>
                              <span className="text-stone-400 font-mono text-[10px]">{ev.date}</span>
                            </div>
                            <blockquote className="pl-2.5 border-l-2 border-emerald-500/40 text-stone-400 italic text-[11px] leading-relaxed">
                              "{ev.excerpt}"
                            </blockquote>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : userEntries.length > 1 && (
            <div id="story-no-changes-notice" className="p-5 bg-stone-900/60 border border-stone-800 rounded-2xl flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-200 mb-1">Distinct Moments Recorded</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Your journal entries cover independent topics and moments. As you continue writing more reflections over days and weeks, overarching evolutions in your habits and routines will naturally emerge.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chronological Reflection Timeline */}
      <div id="story-timeline" className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Chronological Reflection History ({userEntries.length})
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">Earliest to Most Recent</span>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l-2 border-stone-800 space-y-6">
          {userEntries.map((entry, idx) => {
            const formattedDate = entry.createdAt
              ? new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Undated';

            return (
              <div key={entry.id} className="relative group">
                {/* Timeline node dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-stone-950 border-2 border-amber-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>

                {/* Entry Card */}
                <div className="bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-stone-700/80 rounded-xl p-4 sm:p-5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-stone-400 font-semibold bg-stone-800 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-stone-100">{entry.title || 'Untitled Reflection'}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {getMoodBadge(entry.mood)}
                      <div className="flex items-center gap-1 text-[11px] text-stone-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-stone-800/60">
                      {entry.tags.map((tag, tagIdx) => (
                        <span
                          key={tagIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-800/80 text-stone-400 border border-stone-700/40"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
