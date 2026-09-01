import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Clock,
  Flame,
  LineChart,
  Smile,
  Compass,
  TrendingUp,
  Image as ImageIcon,
  MapPin,
  Heart,
  Share2,
  Check,
  Award,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Quote,
  Zap,
  Coffee,
  Bookmark
} from 'lucide-react';
import { UserProfile, JournalEntry, WrappedDataResponse } from '../types';

interface WrappedViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onBackToJournal: () => void;
}

const WRAPPED_CACHE_KEY_PREFIX = 'reflectai_wrapped_cache_';

export const WrappedView: React.FC<WrappedViewProps> = ({
  user,
  entries,
  onBackToJournal,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [wrappedData, setWrappedData] = useState<WrappedDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Filter entries to currently authenticated user and sort chronologically
  const userEntries = React.useMemo(() => {
    return entries
      .filter((e) => e.userId === user.uid)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [entries, user.uid]);

  const cacheKey = `${WRAPPED_CACHE_KEY_PREFIX}${user.uid}`;
  const currentEntriesHash = `${user.uid}_${userEntries.length}_${userEntries.map((e) => e.id + (e.updatedAt || e.createdAt)).join('_')}`;

  // Fetch or generate Wrapped Data
  const fetchWrappedData = useCallback(async (forceRefresh: boolean = false) => {
    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.cachedHash === currentEntriesHash && cached.payload) {
            setWrappedData(cached.payload);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not read cached Wrapped data:', e);
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/wrapped', {
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
            photos: e.photos,
            location: e.location,
            createdAt: e.createdAt,
            photoAttachment: e.photoAttachment,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data: WrappedDataResponse = await response.json();
      setWrappedData(data);

      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            cachedHash: currentEntriesHash,
            payload: data,
          })
        );
      } catch (cacheErr) {
        console.warn('Could not cache Wrapped data:', cacheErr);
      }
    } catch (err) {
      console.warn('Error loading Wrapped data from API, using client fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user.uid, userEntries, cacheKey, currentEntriesHash]);

  useEffect(() => {
    fetchWrappedData(false);
  }, [currentEntriesHash, fetchWrappedData]);

  // Card count: exactly 8 cards
  const TOTAL_CARDS = 8;

  const goToNextCard = useCallback(() => {
    setCurrentCardIndex((prev) => Math.min(prev + 1, TOTAL_CARDS - 1));
  }, [TOTAL_CARDS]);

  const goToPrevCard = useCallback(() => {
    setCurrentCardIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleRestart = () => {
    setCurrentCardIndex(0);
  };

  // Reset scroll position to top whenever switching slides
  useEffect(() => {
    if (scrollContentRef.current) {
      scrollContentRef.current.scrollTop = 0;
    }
  }, [currentCardIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        goToNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevCard();
      } else if (e.key === 'Escape') {
        onBackToJournal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextCard, goToPrevCard, onBackToJournal]);

  // Touch swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      // Swiped left -> Next card
      goToNextCard();
    } else if (diff < -50) {
      // Swiped right -> Prev card
      goToPrevCard();
    }
    setTouchStartX(null);
  };

  const handleCopySummary = () => {
    if (!wrappedData) return;
    const summaryText = `✨ ReflectAI Journal Wrapped ✨
${wrappedData.stats.periodTitle} (${wrappedData.stats.dateRangeFormatted})
📖 Total Entries: ${wrappedData.stats.totalEntries} | 🔥 Streak: ${wrappedData.stats.currentStreak} Days
🌟 Core Themes: ${wrappedData.themes.map(t => t.name).join(', ')}
🎭 Dominant Mood: ${wrappedData.emotionalJourney.dominantMood}
💡 Defining Shift: ${wrappedData.biggestShift.headline}
"${wrappedData.finalReflection.narrative}"
— Generated with ReflectAI`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Render Mood Icon
  const getMoodColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'peaceful':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'energized':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'motivated':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'thoughtful':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'anxious':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'overwhelmed':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-stone-300 bg-stone-800 border-stone-700';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-100">Preparing Your Wrapped Experience...</h2>
          <p className="text-sm text-stone-400">Synthesizing your journal entries, mood shifts, and reflection milestones.</p>
        </div>
        <div className="w-48 h-1.5 bg-stone-800 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  const data = wrappedData;
  const isFirstCard = currentCardIndex === 0;
  const isLastCard = currentCardIndex === TOTAL_CARDS - 1;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col flex-1 select-none animate-fadeIn">
      {/* Top Header & Story Progress Bar */}
      <div className="w-full space-y-3 mb-4 shrink-0">
        {/* Progress Bar Segments */}
        <div className="flex items-center gap-1.5 w-full">
          {Array.from({ length: TOTAL_CARDS }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentCardIndex(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentCardIndex
                  ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                  : idx < currentCardIndex
                  ? 'bg-stone-600 hover:bg-stone-500'
                  : 'bg-stone-800 hover:bg-stone-700'
              }`}
              title={`Card ${idx + 1}`}
              aria-label={`Jump to Card ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              {currentCardIndex + 1} / {TOTAL_CARDS}
            </span>
            <span className="text-stone-600">•</span>
            <span className="text-xs text-stone-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              {currentCardIndex === 0 && 'Your Period'}
              {currentCardIndex === 1 && 'Your Core Themes'}
              {currentCardIndex === 2 && 'Emotional Journey'}
              {currentCardIndex === 3 && 'The Defining Shift'}
              {currentCardIndex === 4 && 'Moments That Mattered'}
              {currentCardIndex === 5 && 'Memories & Keepsakes'}
              {currentCardIndex === 6 && 'Places & Environments'}
              {currentCardIndex === 7 && 'Your Journey Forward'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToJournal}
              className="text-xs text-stone-400 hover:text-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Exit Wrapped
            </button>
          </div>
        </div>
      </div>

      {/* Main Wrapped Card Display (Single Card View) */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-full h-[540px] sm:h-[560px] flex flex-col justify-between overflow-hidden shadow-2xl shadow-stone-950/80 transition-all duration-300 shrink-0"
      >
        {/* Dynamic Background Glow Accent per Card */}
        {currentCardIndex === 0 && (
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 1 && (
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 2 && (
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 3 && (
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 4 && (
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 5 && (
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 6 && (
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {currentCardIndex === 7 && (
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        )}

        {/* CARD CONTENT - Scrollable inner area with pinned top/bottom frames */}
        <div
          ref={scrollContentRef}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1.5 sm:pr-2.5 wrapped-scroll"
        >
          <div className="min-h-full flex flex-col justify-start">
            <div className="my-auto w-full py-1.5 pb-3">
              {/* ========================================================= */}
              {/* CARD 0: YOUR PERIOD */}
              {/* ========================================================= */}
            {currentCardIndex === 0 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="break-words">{data?.stats.dateRangeFormatted || 'Your Reflection Timeline'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-100 tracking-tight break-words">
                    {data?.stats.periodTitle || 'Your 2026 in Reflection'}
                  </h1>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-xl break-words">
                    {data?.stats.isInitialJourney
                      ? "You've taken the first meaningful steps in your journaling journey. Here is a look at your early reflections and mindful cadence."
                      : 'A celebration of your consistency, self-inquiry, and moments of mindful pause across your personal journey.'}
                  </p>
                </div>

                {/* Real Deterministic Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-1">
                    <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Entries</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-stone-100">
                      {data?.stats.totalEntries || userEntries.length}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">Total reflections</div>
                  </div>

                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-1">
                    <div className="text-orange-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      <span>Streak</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-stone-100">
                      {data?.stats.currentStreak || 1} {data?.stats.currentStreak === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">Current streak</div>
                  </div>

                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-1">
                    <div className="text-sky-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Active Days</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-stone-100">
                      {data?.stats.activeDaysCount || 1}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">Days journaled</div>
                  </div>

                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-1">
                    <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Words</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-stone-100">
                      {data?.stats.totalWordsLogged || 0}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">Words captured</div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 1: YOUR THEMES */}
            {/* ========================================================= */}
            {currentCardIndex === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>Thematic Focus</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight break-words">
                    The Themes That Shaped Your Reflections
                  </h2>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                    These topics recurred most prominently across your journal entries and self-inquiries.
                  </p>
                </div>

                {/* Themes List */}
                <div className="space-y-2.5 pt-1">
                  {data?.themes && data.themes.length > 0 ? (
                    data.themes.map((theme, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-all hover:border-stone-700"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                              #{idx + 1}
                            </span>
                            <h3 className="font-bold text-stone-100 text-sm sm:text-base break-words">{theme.name}</h3>
                          </div>
                          <p className="text-xs text-stone-400 pl-7 leading-relaxed break-words">
                            {theme.description}
                          </p>
                        </div>
                        <div className="shrink-0 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-violet-300">
                          {theme.count} {theme.count === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-6 text-center text-stone-400 text-xs sm:text-sm">
                      No recurring themes detected yet. As you continue tagging and logging reflections, your top topics will emerge here.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 2: YOUR EMOTIONAL JOURNEY */}
            {/* ========================================================= */}
            {currentCardIndex === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Smile className="w-3.5 h-3.5 shrink-0" />
                    <span>Emotional Flow</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight break-words">
                    Your Emotional Journey
                  </h2>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                    How your state of mind developed across your journaling practice.
                  </p>
                </div>

                {/* Mood Evolution Arc */}
                <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    Timeline Progression
                  </div>
                  <div className="flex items-center justify-between gap-2 text-center">
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="text-[11px] text-stone-400">Earlier</div>
                      <div className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-bold capitalize truncate ${getMoodColor(data?.emotionalJourney.earlierMood || 'thoughtful')}`}>
                        {data?.emotionalJourney.earlierMood || 'Thoughtful'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-600 shrink-0" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="text-[11px] text-stone-400">Dominant</div>
                      <div className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-bold capitalize shadow-sm truncate ${getMoodColor(data?.emotionalJourney.dominantMood || 'thoughtful')}`}>
                        {data?.emotionalJourney.dominantMood || 'Thoughtful'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-600 shrink-0" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="text-[11px] text-stone-400">Recent</div>
                      <div className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-bold capitalize truncate ${getMoodColor(data?.emotionalJourney.recentMood || 'thoughtful')}`}>
                        {data?.emotionalJourney.recentMood || 'Thoughtful'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80">
                    <p className="text-xs text-stone-300 leading-relaxed italic break-words">
                      "{data?.emotionalJourney.progressionDescription}"
                    </p>
                  </div>
                </div>

                {/* Mood breakdown chips */}
                {data?.emotionalJourney.moodCounts && Object.keys(data.emotionalJourney.moodCounts).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="text-[11px] text-stone-400">Recorded states:</span>
                    {Object.entries(data.emotionalJourney.moodCounts).map(([m, count]) => (
                      <span
                        key={m}
                        className={`text-xs px-2.5 py-0.5 rounded-lg border font-medium capitalize ${getMoodColor(m)}`}
                      >
                        {m}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 3: YOUR BIGGEST SHIFT */}
            {/* ========================================================= */}
            {currentCardIndex === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Growth & Transformation</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight break-words">
                    {data?.biggestShift.headline || 'Your Defining Shift'}
                  </h2>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                    {data?.biggestShift.explanation}
                  </p>
                </div>

                {/* Grounded Before & After Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="font-semibold uppercase tracking-wider">Earlier Reflection</span>
                        <span>{data?.biggestShift.earlierExcerpt.date}</span>
                      </div>
                      <div className="text-xs font-bold text-stone-200 break-words">
                        {data?.biggestShift.earlierExcerpt.title}
                      </div>
                    </div>
                    <div className="text-xs text-stone-400 italic bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/60 leading-relaxed break-words">
                      "{data?.biggestShift.earlierExcerpt.text}"
                    </div>
                  </div>

                  <div className="bg-stone-950/70 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-400">
                        <span className="font-semibold uppercase tracking-wider">Recent Evolution</span>
                        <span>{data?.biggestShift.recentExcerpt.date}</span>
                      </div>
                      <div className="text-xs font-bold text-stone-100 break-words">
                        {data?.biggestShift.recentExcerpt.title}
                      </div>
                    </div>
                    <div className="text-xs text-stone-300 italic bg-stone-900/80 p-2.5 rounded-xl border border-stone-800 leading-relaxed break-words">
                      "{data?.biggestShift.recentExcerpt.text}"
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 4: MOMENTS THAT MATTERED */}
            {/* ========================================================= */}
            {currentCardIndex === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Bookmark className="w-3.5 h-3.5 shrink-0" />
                    <span>Highlights</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight break-words">
                    Moments That Mattered
                  </h2>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                    Standout reflections from your journal that captured key turning points and breakthroughs.
                  </p>
                </div>

                {/* Moments List */}
                <div className="space-y-2.5 pt-1">
                  {data?.moments && data.moments.length > 0 ? (
                    data.moments.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3 sm:p-3.5 space-y-1.5 hover:border-stone-700 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-bold text-xs sm:text-sm text-stone-100 break-words">{m.title}</span>
                            <span className={`text-[10px] px-2 py-0.2 rounded-full border font-medium capitalize shrink-0 ${getMoodColor(m.mood)}`}>
                              {m.mood}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 shrink-0 ml-2">{m.date}</span>
                        </div>
                        <p className="text-xs text-stone-300 italic leading-relaxed bg-stone-900/50 p-2 rounded-xl border border-stone-800/40 break-words">
                          "{m.excerpt}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-6 text-center text-stone-400 text-xs sm:text-sm">
                      No milestone moments identified yet. As you record rich reflections, your standout memories will appear here.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 5: MEMORIES (Photos) */}
            {/* ========================================================= */}
            {currentCardIndex === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Visual Keepsakes</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight break-words">
                    Memories in Reflection
                  </h2>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                    Visual moments and memories attached to your journal entries.
                  </p>
                </div>

                {/* Photos Gallery or Graceful Empty State */}
                {data?.photos && data.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {data.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-950/80 border border-stone-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between"
                      >
                        <img
                          src={photo.photoUrl}
                          alt={photo.entryTitle}
                          className="w-full h-32 sm:h-36 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-2.5">
                          <div className="text-xs font-semibold text-stone-200 break-words">{photo.entryTitle}</div>
                          <div className="text-[10px] text-stone-400">{photo.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-sm sm:text-base font-bold text-stone-200">No Photo Attachments Yet</h3>
                      <p className="text-xs text-stone-400 leading-relaxed break-words">
                        When you include images or visual captures with your journal entries, your personal Wrapped highlights them here. Your written reflections are already building a rich narrative timeline.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 6: PLACES & ENVIRONMENTS */}
            {/* ========================================================= */}
            {currentCardIndex === 6 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Places & Sanctuaries</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight break-words">
                    Places Connected to Your Thoughts
                  </h2>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                    Environments and spaces where your journaling took place.
                  </p>
                </div>

                {/* Places List or Privacy-Compliant Empty State */}
                {data?.places && data.places.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {data.places.map((place, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-stone-100 break-words">{place.name}</div>
                          <div className="text-[11px] text-stone-400 break-words">Linked to "{place.entryTitle}"</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-sm sm:text-base font-bold text-stone-200">Privacy-First Location Architecture</h3>
                      <p className="text-xs text-stone-400 leading-relaxed break-words">
                        ReflectAI never tracks your live location or requests background GPS access. Any specific study spaces, cities, or retreat locations you explicitly record in your reflections will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* CARD 7: FINAL REFLECTION */}
            {/* ========================================================= */}
            {currentCardIndex === 7 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400 text-stone-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-100 tracking-tight pt-1 break-words">
                    {data?.finalReflection.headline || 'Your Reflections Build Clarity'}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span>Gemini Retrospective Synthesis</span>
                  </div>
                </div>

                {/* Final Synthesis Narrative */}
                <div className="bg-stone-950/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-normal break-words">
                    {data?.finalReflection.narrative}
                  </p>

                  <div className="pt-2 border-t border-stone-800/80 flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 font-medium italic leading-relaxed break-words">
                      "{data?.finalReflection.celebrationQuote}"
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={handleRestart}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>

                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>

                  <button
                    onClick={onBackToJournal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Return to Journal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS & NAVIGATION */}
        <div className="relative z-10 pt-4 mt-2 border-t border-stone-800/80 flex items-center justify-between shrink-0">
          <button
            id="wrapped-prev-btn"
            onClick={goToPrevCard}
            disabled={isFirstCard}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isFirstCard
                ? 'text-stone-600 opacity-40 cursor-not-allowed'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Center Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_CARDS }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentCardIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentCardIndex
                    ? 'w-6 bg-amber-400 shadow-xs'
                    : 'w-2 bg-stone-700 hover:bg-stone-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            id="wrapped-next-btn"
            onClick={isLastCard ? onBackToJournal : goToNextCard}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isLastCard
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                : 'bg-stone-100 hover:bg-white text-stone-950'
            }`}
          >
            <span>{isLastCard ? 'Done' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer Navigation Tip */}
      <div className="text-center pt-4">
        <p className="text-[11px] text-stone-400">
          Tip: Use <kbd className="px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700 text-[10px] text-stone-300">←</kbd> and <kbd className="px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700 text-[10px] text-stone-300">→</kbd> arrow keys to navigate or swipe on touch devices.
        </p>
      </div>
    </div>
  );
};
