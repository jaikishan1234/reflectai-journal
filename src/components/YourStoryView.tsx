import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Milestone,
  Compass,
  Tag,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { JournalEntry, UserProfile, YourStoryResponse } from '../types';

interface YourStoryViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
  onSelectEntry?: (entry: JournalEntry) => void;
}

export const YourStoryView: React.FC<YourStoryViewProps> = ({
  entries,
  user,
  onNewEntry,
  onSelectEntry,
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

  // Semantic mood badge styling
  const getMoodBadge = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'peaceful':
      case 'calm':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#16271F] text-[#34D399] border border-[#34D399]/25 inline-flex items-center gap-1">
            <span>🌿</span>
            <span>{mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase()}</span>
          </span>
        );
      case 'energized':
      case 'motivated':
      case 'focused':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#3282B8]/15 text-[#4FA3D1] border border-[#3282B8]/30 inline-flex items-center gap-1">
            <span>⚡</span>
            <span>{mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase()}</span>
          </span>
        );
      case 'grateful':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#2A2315] text-[#FBBF24] border border-[#FBBF24]/25 inline-flex items-center gap-1">
            <span>✨</span>
            <span>{mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase()}</span>
          </span>
        );
      case 'anxious':
      case 'overwhelmed':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#2D1B1B] text-[#F87171] border border-[#F87171]/25 inline-flex items-center gap-1">
            <span>🌧️</span>
            <span>{mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase()}</span>
          </span>
        );
      case 'creative':
      case 'thoughtful':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#201A30] text-[#A78BFA] border border-[#A78BFA]/25 inline-flex items-center gap-1">
            <span>🤔</span>
            <span>{(mood || 'Thoughtful').charAt(0).toUpperCase() + (mood || 'Thoughtful').slice(1).toLowerCase()}</span>
          </span>
        );
    }
  };

  // Distinct narrative threads across entries
  const narrativeThreads = Array.from(new Set(userEntries.flatMap(e => e.tags || []))).slice(0, 8);

  // If user has zero entries
  if (userEntries.length === 0) {
    return (
      <div id="story-empty-state" className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-2xl mx-auto py-16">
        <div className="w-14 h-14 rounded-2xl bg-[#1D2328] border border-[#30383F] text-[#4FA3D1] flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-semibold text-[#F4F1EA] mb-2 tracking-tight">Your Story Begins Here</h2>
        <p className="text-sm text-[#A7ADB2] mb-6 max-w-md leading-relaxed">
          Your Story chronicles how your perspective, decisions, and priorities evolve over time. Once you begin recording reflections in your journal, your personal narrative will unfold here.
        </p>
        <button
          id="story-empty-new-entry-btn"
          onClick={onNewEntry}
          className="flex items-center gap-2 px-4 py-2 bg-[#3282B8] hover:bg-[#286894] text-[#F4F1EA] font-medium text-xs rounded-xl transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Write Your First Reflection</span>
        </button>
      </div>
    );
  }

  return (
    <div id="story-container" className="flex-1 max-w-5xl mx-auto w-full py-6 space-y-8">
      {/* Top Header & Trust Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#30383F]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] tracking-tight">
              Your Story
            </h1>
            <span className="text-xs font-medium bg-[#171B1F] text-[#A7ADB2] px-2.5 py-1 rounded-full border border-[#30383F]">
              {userEntries.length} {userEntries.length === 1 ? 'reflection' : 'reflections'}
            </span>
          </div>
          <p className="text-sm text-[#A7ADB2] mt-1.5">
            See how your thoughts, experiences, and priorities have evolved through your journal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 text-xs text-[#747C82] bg-[#171B1F] border border-[#30383F] px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Private & isolated</span>
          </div>
          <button
            id="story-refresh-btn"
            onClick={() => fetchYourStory(true)}
            disabled={isLoading || userEntries.length < 2}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171B1F] hover:bg-[#252C32] text-[#F4F1EA] text-xs font-medium rounded-xl border border-[#30383F] transition-colors cursor-pointer disabled:opacity-50"
            title="Re-run narrative synthesis across your reflections"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#4FA3D1] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Re-analyze Story'}</span>
          </button>
        </div>
      </div>

      {/* Verification & Metadata Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#747C82] px-1">
        <div className="flex items-center gap-2">
          <span>Model: <strong className="text-[#A7ADB2] font-mono font-normal">{storyData?.modelUsed || 'gemini-3.6-flash'}</strong></span>
          {storyData?.timestamp && (
            <>
              <span className="text-[#30383F]">•</span>
              <span>Updated: <strong className="text-[#A7ADB2] font-normal">{new Date(storyData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </>
          )}
        </div>
        <span>Chronological journal perspective</span>
      </div>

      {/* Error Message if any */}
      {error && (
        <div className="p-4 bg-[#2D1B1B] border border-[#F87171]/30 rounded-xl text-xs text-[#F87171] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchYourStory(true)}
            className="px-2.5 py-1 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F4F1EA] rounded-md font-medium text-[11px] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Insufficient Entries Notice (If only 1 entry) */}
      {userEntries.length === 1 && (
        <div id="story-insufficient-notice" className="p-5 bg-[#1D2328] border border-[#30383F] rounded-2xl flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#252C32] border border-[#30383F] flex items-center justify-center text-[#A78BFA] shrink-0 mt-0.5">
            <Milestone className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#F4F1EA] mb-1">First Reflection in Motion</h3>
            <p className="text-xs text-[#A7ADB2] leading-relaxed">
              You have 1 saved reflection so far. To reveal narrative arcs, turning points, and how your habits or perspectives evolve across time, at least 2 entries are needed.
            </p>
            <button
              onClick={onNewEntry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3282B8] hover:bg-[#286894] text-[#F4F1EA] font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Write Next Reflection</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Change-Over-Time Analysis Cards */}
      {isLoading ? (
        <div className="p-8 sm:p-12 bg-[#1D2328] border border-[#30383F] rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#4FA3D1] animate-spin mb-1" />
          <h3 className="text-sm font-semibold text-[#F4F1EA]">Weaving Your Narrative Story</h3>
          <p className="text-xs text-[#A7ADB2] max-w-sm leading-relaxed">
            Comparing earlier reflections against recent writing for emerging shifts, milestones, and turning points...
          </p>
        </div>
      ) : storyData && (
        <div className="space-y-8">
          {/* 1. High-Level Journey Summary - Editorial Centerpiece */}
          <section 
            id="story-summary-card" 
            className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#30383F]">
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#4FA3D1]" />
                <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                  Narrative Summary
                </h2>
              </div>
              <span className="text-[11px] font-medium text-[#4FA3D1] bg-[#3282B8]/10 border border-[#3282B8]/30 px-2.5 py-1 rounded-full w-fit">
                Editorial synthesis
              </span>
            </div>

            <div className="p-6 bg-[#171B1F] border border-[#30383F] rounded-xl">
              <p className="text-sm sm:text-base text-[#F4F1EA] font-normal leading-relaxed max-w-4xl">
                {storyData.summary}
              </p>
            </div>
          </section>

          {/* 2. Detected Meaningful Changes & Turning Points */}
          {storyData.hasSufficientContext && storyData.changes.length > 0 ? (
            <section id="story-changes-list" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#30383F]">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
                    Documented Shifts & Turning Points
                  </h2>
                  <p className="text-xs text-[#A7ADB2] mt-0.5">
                    Observable transitions between earlier reflections and recent perspective
                  </p>
                </div>
                <span className="text-xs font-medium text-[#A78BFA] bg-[#201A30] border border-[#A78BFA]/25 px-2.5 py-1 rounded-full w-fit">
                  {storyData.changes.length} {storyData.changes.length === 1 ? 'shift identified' : 'shifts identified'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {storyData.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-7 space-y-5"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#201A30] border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-semibold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-[#F4F1EA] tracking-tight">
                          {change.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-[#A7ADB2] mt-2 leading-relaxed pl-9">
                        {change.description}
                      </p>
                    </div>

                    {/* Grounded Evidence Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 pl-0 sm:pl-9">
                      {/* Earlier Evidence Column */}
                      <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#30383F]">
                          <span className="text-xs font-medium text-[#FBBF24] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Earlier Phase</span>
                          </span>
                          <span className="text-[10px] font-medium bg-[#2A2315] text-[#FBBF24] border border-[#FBBF24]/25 px-2 py-0.5 rounded">
                            Baseline
                          </span>
                        </div>
                        {change.earlierEvidence.map((ev, evIdx) => (
                          <div key={evIdx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-[#F4F1EA] font-medium">
                              <span className="truncate max-w-[220px]">"{ev.entryTitle}"</span>
                              <span className="text-[11px] text-[#747C82] font-mono">{ev.date}</span>
                            </div>
                            <blockquote className="pl-3 border-l-2 border-[#FBBF24]/40 text-xs text-[#A7ADB2] italic leading-relaxed">
                              "{ev.excerpt}"
                            </blockquote>
                          </div>
                        ))}
                      </div>

                      {/* Recent Evidence Column */}
                      <div className="bg-[#171B1F] border border-[#30383F] rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#30383F]">
                          <span className="text-xs font-medium text-[#34D399] flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Recent Phase</span>
                          </span>
                          <span className="text-[10px] font-medium bg-[#16271F] text-[#34D399] border border-[#34D399]/25 px-2 py-0.5 rounded">
                            Evolution
                          </span>
                        </div>
                        {change.recentEvidence.map((ev, evIdx) => (
                          <div key={evIdx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-[#F4F1EA] font-medium">
                              <span className="truncate max-w-[220px]">"{ev.entryTitle}"</span>
                              <span className="text-[11px] text-[#747C82] font-mono">{ev.date}</span>
                            </div>
                            <blockquote className="pl-3 border-l-2 border-[#34D399]/40 text-xs text-[#A7ADB2] italic leading-relaxed">
                              "{ev.excerpt}"
                            </blockquote>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : userEntries.length > 1 && (
            <div id="story-no-changes-notice" className="p-5 bg-[#1D2328] border border-[#30383F] rounded-2xl flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#171B1F] border border-[#30383F] flex items-center justify-center text-[#34D399] shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4F1EA] mb-1">Consistent Personal Foundation</h4>
                <p className="text-xs text-[#A7ADB2] leading-relaxed">
                  Your journal entries currently explore consistent themes. As you continue writing across different weeks and situations, larger developmental shifts and turning points will naturally emerge here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Chronological Reflection Timeline */}
      <section id="story-timeline" className="bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#30383F]">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#F4F1EA] tracking-tight">
              Chronological Journey
            </h2>
            <p className="text-xs text-[#A7ADB2] mt-0.5">
              Your reflections recorded in sequential order from earliest to latest
            </p>
          </div>
          <span className="text-xs text-[#747C82] font-mono">
            {userEntries.length} {userEntries.length === 1 ? 'reflection' : 'reflections'}
          </span>
        </div>

        {/* Narrative Threads (Entry Tags as Chapters) */}
        {narrativeThreads.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs text-[#747C82] flex items-center gap-1 mr-1">
              <Bookmark className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Narrative Threads:</span>
            </span>
            {narrativeThreads.map((thread, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-1 rounded-md bg-[#171B1F] border border-[#30383F] text-[#A7ADB2] font-normal"
              >
                #{thread}
              </span>
            ))}
          </div>
        )}

        {/* Timeline Flow */}
        <div className="relative pl-6 sm:pl-8 border-l border-[#30383F] space-y-6 pt-2">
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
                {/* Timeline node marker */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full bg-[#111416] border-2 border-[#3282B8] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4FA3D1]" />
                </div>

                {/* Entry Card */}
                <div 
                  className={`bg-[#171B1F] border border-[#30383F] rounded-xl p-4 sm:p-5 transition-all ${
                    onSelectEntry ? 'hover:border-[#3282B8]/40 hover:bg-[#1C2227] cursor-pointer' : ''
                  }`}
                  onClick={() => onSelectEntry && onSelectEntry(entry)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#747C82] font-medium bg-[#252C32] px-2 py-0.5 rounded border border-[#30383F]">
                        #{idx + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-[#F4F1EA]">
                        {entry.title || 'Untitled Reflection'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {getMoodBadge(entry.mood)}
                      <div className="flex items-center gap-1 text-xs text-[#747C82]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#F4F1EA]/85 leading-relaxed line-clamp-3 font-normal">
                    {entry.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#30383F]/70">
                    {entry.tags && entry.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {entry.tags.map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-normal bg-[#252C32] text-[#A7ADB2] border border-[#30383F]"
                          >
                            <Tag className="w-2.5 h-2.5 text-[#747C82]" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span />
                    )}

                    {onSelectEntry && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#4FA3D1] font-medium group-hover:text-[#BBE1FA] transition-colors">
                        <span>Read entry</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

