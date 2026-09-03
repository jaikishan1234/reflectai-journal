import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  Download,
  Sparkles,
  Filter,
  Smile,
  Video,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Music,
  X,
  ChevronDown,
  Check,
  Layers,
} from 'lucide-react';

export type DateRangeFilter = 'all' | 'today' | '7d' | '30d' | 'custom';
export type ContextFilter = 'all' | 'none' | 'youtube' | 'link' | 'photo' | 'file' | 'spotify';
export type AiFilter = 'all' | 'with_ai' | 'without_ai';

interface HistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  userName: string;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  userName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [contextFilter, setContextFilter] = useState<ContextFilter>('all');
  const [aiFilter, setAiFilter] = useState<AiFilter>('all');
  const [activeDropdown, setActiveDropdown] = useState<'mood' | 'date' | 'context' | 'ai' | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedMoodFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    contextFilter !== 'all' ||
    aiFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMoodFilter('all');
    setDateRangeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setContextFilter('all');
    setAiFilter('all');
    setActiveDropdown(null);
  };

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOf7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();
    const startOf30DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const customStartMs = customStartDate
      ? (() => {
          const [y, m, d] = customStartDate.split('-').map(Number);
          return !isNaN(y) && !isNaN(m) && !isNaN(d) ? new Date(y, m - 1, d, 0, 0, 0, 0).getTime() : null;
        })()
      : null;

    const customEndMs = customEndDate
      ? (() => {
          const [y, m, d] = customEndDate.split('-').map(Number);
          return !isNaN(y) && !isNaN(m) && !isNaN(d) ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime() : null;
        })()
      : null;

    return entries.filter(e => {
      // 1. Text Search
      const matchSearch =
        !searchQuery.trim() ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Mood Filter
      const matchMood = selectedMoodFilter === 'all' || e.mood === selectedMoodFilter;

      // 3. Date Range Filter
      const entryDate = new Date(e.createdAt);
      const entryTime = entryDate.getTime();
      let matchDate = true;

      if (!isNaN(entryTime)) {
        if (dateRangeFilter === 'today') {
          matchDate =
            entryDate.getFullYear() === now.getFullYear() &&
            entryDate.getMonth() === now.getMonth() &&
            entryDate.getDate() === now.getDate();
        } else if (dateRangeFilter === '7d') {
          matchDate = entryTime >= startOf7DaysAgo && entryTime <= endOfToday;
        } else if (dateRangeFilter === '30d') {
          matchDate = entryTime >= startOf30DaysAgo && entryTime <= endOfToday;
        } else if (dateRangeFilter === 'custom') {
          if (customStartMs !== null && entryTime < customStartMs) {
            matchDate = false;
          }
          if (customEndMs !== null && entryTime > customEndMs) {
            matchDate = false;
          }
        }
      }

      // 4. Context Type Filter
      const hasYouTube = Boolean(e.youtubeAttachment);
      const hasWebLink = Boolean(e.webLinkAttachment);
      const hasPhoto = Boolean(e.photoAttachment || (e.photos && e.photos.length > 0));
      const hasFile = Boolean(e.fileAttachment);
      const hasSpotify = Boolean(e.spotifyAttachment);
      const hasAnyContext = hasYouTube || hasWebLink || hasPhoto || hasFile || hasSpotify;

      let matchContext = true;
      if (contextFilter === 'none') {
        matchContext = !hasAnyContext;
      } else if (contextFilter === 'youtube') {
        matchContext = hasYouTube;
      } else if (contextFilter === 'link') {
        matchContext = hasWebLink;
      } else if (contextFilter === 'photo') {
        matchContext = hasPhoto;
      } else if (contextFilter === 'file') {
        matchContext = hasFile;
      } else if (contextFilter === 'spotify') {
        matchContext = hasSpotify;
      }

      // 5. AI Reflection Filter
      const hasAi = Boolean(e.aiResponse && e.aiResponse.trim().length > 0);
      let matchAi = true;
      if (aiFilter === 'with_ai') {
        matchAi = hasAi;
      } else if (aiFilter === 'without_ai') {
        matchAi = !hasAi;
      }

      return matchSearch && matchMood && matchDate && matchContext && matchAi;
    });
  }, [entries, searchQuery, selectedMoodFilter, dateRangeFilter, customStartDate, customEndDate, contextFilter, aiFilter]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `reflectai_journal_${userName.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    let mdContent = `# ReflectAI Journal & Reflection Archive\nUser: ${userName}\nExport Date: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    entries.forEach((e, idx) => {
      mdContent += `## ${idx + 1}. ${e.title}\n`;
      mdContent += `*Date: ${new Date(e.createdAt).toLocaleString()} | Mood: ${e.mood} | Mode: ${e.mode}*\n\n`;
      mdContent += `### Journal Content\n${e.content}\n\n`;
      if (e.youtubeAttachment) {
        mdContent += `*Attached Video Context: ${e.youtubeAttachment.title} (${e.youtubeAttachment.url})*\n\n`;
      }
      if (e.webLinkAttachment) {
        mdContent += `*Attached Web Link: ${e.webLinkAttachment.title} (${e.webLinkAttachment.url})*\n\n`;
      }
      if (e.photoAttachment) {
        mdContent += `*Attached Photo: ${e.photoAttachment.fileName || 'Memory Photo'}${e.photoAttachment.caption ? ` - "${e.photoAttachment.caption}"` : ''}*\n\n`;
      }
      if (e.aiResponse) {
        mdContent += `### Gemini AI Reflection\n${e.aiResponse}\n\n`;
      }
      if (e.messages && e.messages.length > 0) {
        mdContent += `### Dialogue Turns\n`;
        e.messages.forEach(m => {
          mdContent += `- **${m.role === 'user' ? 'You' : 'Gemini'}**: ${m.content}\n`;
        });
        mdContent += `\n`;
      }
      mdContent += `---\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `reflectai_journal_${userName.toLowerCase().replace(/\s+/g, '_')}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getMoodLabel = () => {
    if (selectedMoodFilter === 'all') return 'Mood';
    return selectedMoodFilter.charAt(0).toUpperCase() + selectedMoodFilter.slice(1);
  };

  const getDateLabel = () => {
    if (dateRangeFilter === 'all') return 'Date';
    if (dateRangeFilter === 'today') return 'Today';
    if (dateRangeFilter === '7d') return 'Last 7d';
    if (dateRangeFilter === '30d') return 'Last 30d';
    return 'Custom';
  };

  const getContextLabel = () => {
    if (contextFilter === 'all') return 'Context';
    if (contextFilter === 'none') return 'No Context';
    if (contextFilter === 'youtube') return 'YouTube';
    if (contextFilter === 'link') return 'Web Link';
    if (contextFilter === 'photo') return 'Photo';
    if (contextFilter === 'file') return 'Docs';
    if (contextFilter === 'spotify') return 'Spotify';
    return 'Context';
  };

  const getAiLabel = () => {
    if (aiFilter === 'all') return 'AI Reflection';
    if (aiFilter === 'with_ai') return 'With AI';
    return 'No AI';
  };

  return (
    <aside className="w-full max-w-full min-w-0 lg:w-80 shrink-0 bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col h-full shadow-lg">
      {/* Top Section */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-xs sm:text-sm text-stone-200">Reflection History</h3>
        </div>
        <span className="text-[11px] text-stone-500 bg-stone-950 px-2 py-0.5 rounded-full border border-stone-800">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* New Reflection Button */}
      <button
        id="history-new-entry-btn"
        onClick={onNewEntry}
        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer mb-3"
      >
        <Plus className="w-4 h-4" />
        <span>New Reflection Entry</span>
      </button>

      {/* Search Bar */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
        <input
          id="history-search-input"
          type="text"
          placeholder="Search by title, tag, or text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50"
        />
      </div>

      {/* Filter Header & Active Reset */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-medium">
              {filteredEntries.length}/{entries.length}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            id="history-filter-reset-btn"
            onClick={handleResetFilters}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs cursor-pointer font-medium transition-colors"
            title="Reset all filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset all</span>
          </button>
        )}
      </div>

      {/* Compact 2x2 Filter Toolbar */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5 relative">
        {/* Backdrop for click-outside */}
        {activeDropdown && (
          <div
            className="fixed inset-0 z-20"
            onClick={() => setActiveDropdown(null)}
          />
        )}

        {/* 1. Mood Filter Dropdown */}
        <div className="relative">
          <button
            id="history-filter-mood-trigger"
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'mood' ? null : 'mood')}
            className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              selectedMoodFilter !== 'all'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium shadow-xs'
                : 'bg-stone-950/80 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Smile className={`w-3.5 h-3.5 shrink-0 ${selectedMoodFilter !== 'all' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span className="truncate">{getMoodLabel()}</span>
            </div>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'mood' ? 'rotate-180 text-amber-400' : 'text-stone-500'}`} />
          </button>

          {activeDropdown === 'mood' && (
            <div className="absolute top-full left-0 mt-1 z-30 w-44 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md">
              <div className="text-[10px] uppercase font-semibold text-stone-500 px-2 py-1 tracking-wider">
                Select Mood
              </div>
              <button
                id="history-filter-mood-all"
                type="button"
                onClick={() => {
                  setSelectedMoodFilter('all');
                  setActiveDropdown(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedMoodFilter === 'all'
                    ? 'bg-amber-500/15 text-amber-300 font-medium'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                }`}
              >
                <span>All Moods</span>
                {selectedMoodFilter === 'all' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              {['thoughtful', 'motivated', 'peaceful', 'anxious', 'energized', 'overwhelmed'].map(m => (
                <button
                  key={m}
                  id={`history-filter-mood-${m}`}
                  type="button"
                  onClick={() => {
                    setSelectedMoodFilter(m);
                    setActiveDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                    selectedMoodFilter === m
                      ? 'bg-amber-500/15 text-amber-300 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                  }`}
                >
                  <span>{m}</span>
                  {selectedMoodFilter === m && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Date Range Filter Dropdown */}
        <div className="relative">
          <button
            id="history-filter-date-trigger"
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
            className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              dateRangeFilter !== 'all'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium shadow-xs'
                : 'bg-stone-950/80 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className={`w-3.5 h-3.5 shrink-0 ${dateRangeFilter !== 'all' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span className="truncate">{getDateLabel()}</span>
            </div>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'date' ? 'rotate-180 text-amber-400' : 'text-stone-500'}`} />
          </button>

          {activeDropdown === 'date' && (
            <div className="absolute top-full right-0 mt-1 z-30 w-52 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md">
              <div className="text-[10px] uppercase font-semibold text-stone-500 px-2 py-1 tracking-wider">
                Select Date Range
              </div>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ].map(item => (
                <button
                  key={item.id}
                  id={`history-filter-date-${item.id}`}
                  type="button"
                  onClick={() => {
                    setDateRangeFilter(item.id as DateRangeFilter);
                    if (item.id !== 'custom') {
                      setActiveDropdown(null);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    dateRangeFilter === item.id
                      ? 'bg-amber-500/15 text-amber-300 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {dateRangeFilter === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}

              {dateRangeFilter === 'custom' && (
                <div className="mt-2 pt-2 border-t border-stone-800 px-1 space-y-2">
                  <div>
                    <label htmlFor="history-custom-start-date" className="block text-[10px] text-stone-400 font-medium mb-1">
                      Start Date
                    </label>
                    <input
                      id="history-custom-start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-stone-200 text-xs focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="history-custom-end-date" className="block text-[10px] text-stone-400 font-medium mb-1">
                      End Date
                    </label>
                    <input
                      id="history-custom-end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-stone-200 text-xs focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {(customStartDate || customEndDate) && (
                      <button
                        id="history-custom-date-clear-btn"
                        type="button"
                        onClick={() => {
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }}
                        className="text-[11px] text-stone-400 hover:text-rose-400 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(null)}
                      className="ml-auto px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Context Filter Dropdown */}
        <div className="relative">
          <button
            id="history-filter-context-trigger"
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'context' ? null : 'context')}
            className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              contextFilter !== 'all'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium shadow-xs'
                : 'bg-stone-950/80 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className={`w-3.5 h-3.5 shrink-0 ${contextFilter !== 'all' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span className="truncate">{getContextLabel()}</span>
            </div>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'context' ? 'rotate-180 text-amber-400' : 'text-stone-500'}`} />
          </button>

          {activeDropdown === 'context' && (
            <div className="absolute top-full left-0 mt-1 z-30 w-48 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md">
              <div className="text-[10px] uppercase font-semibold text-stone-500 px-2 py-1 tracking-wider">
                Select Context
              </div>
              {[
                { id: 'all', label: 'All Contexts' },
                { id: 'none', label: 'No Context' },
                { id: 'youtube', label: 'YouTube', icon: Video },
                { id: 'link', label: 'Web Link', icon: LinkIcon },
                { id: 'photo', label: 'Photo/Image', icon: ImageIcon },
                { id: 'file', label: 'Files/Docs', icon: FileText },
                { id: 'spotify', label: 'Music/Spotify', icon: Music },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`history-filter-context-${item.id}`}
                    type="button"
                    onClick={() => {
                      setContextFilter(item.id as ContextFilter);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      contextFilter === item.id
                        ? 'bg-amber-500/15 text-amber-300 font-medium'
                        : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-3.5 h-3.5 text-stone-400" />}
                      <span>{item.label}</span>
                    </div>
                    {contextFilter === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. AI Reflection Filter Dropdown */}
        <div className="relative">
          <button
            id="history-filter-ai-trigger"
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'ai' ? null : 'ai')}
            className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              aiFilter !== 'all'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium shadow-xs'
                : 'bg-stone-950/80 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${aiFilter !== 'all' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span className="truncate">{getAiLabel()}</span>
            </div>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${activeDropdown === 'ai' ? 'rotate-180 text-amber-400' : 'text-stone-500'}`} />
          </button>

          {activeDropdown === 'ai' && (
            <div className="absolute top-full right-0 mt-1 z-30 w-48 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md">
              <div className="text-[10px] uppercase font-semibold text-stone-500 px-2 py-1 tracking-wider">
                AI Reflection
              </div>
              {[
                { id: 'all', label: 'All Entries' },
                { id: 'with_ai', label: 'With AI Reflection', icon: Sparkles },
                { id: 'without_ai', label: 'Without AI Reflection' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`history-filter-ai-${item.id}`}
                    type="button"
                    onClick={() => {
                      setAiFilter(item.id as AiFilter);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      aiFilter === item.id
                        ? 'bg-amber-500/15 text-amber-300 font-medium'
                        : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{item.label}</span>
                    </div>
                    {aiFilter === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[500px]">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            <p>No journal entries match your filter.</p>
            {hasActiveFilters && (
              <button
                id="history-filter-clear-empty-btn"
                onClick={handleResetFilters}
                className="mt-2 text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((e) => {
            const isSelected = e.id === selectedEntryId;
            return (
              <div
                key={e.id}
                id={`history-entry-item-${e.id}`}
                onClick={() => onSelectEntry(e)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 text-stone-100 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-stone-950/70 border-stone-800/80 text-stone-300 hover:bg-stone-800/50 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-xs truncate max-w-[170px] text-stone-200">
                    {e.title || 'Untitled Reflection'}
                  </h4>
                  <span className="text-[9px] text-stone-500 shrink-0">
                    {new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed mb-2 font-normal">
                  {e.content || 'Empty entry'}
                </p>

                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-400 capitalize">
                      {e.mood}
                    </span>
                    {e.youtubeAttachment && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-red-950/40 border border-red-800/40 rounded text-red-400 flex items-center gap-0.5" title="Connected YouTube Video">
                        <Video className="w-2.5 h-2.5" />
                        Video
                      </span>
                    )}
                    {e.webLinkAttachment && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950/40 border border-cyan-800/40 rounded text-cyan-400 flex items-center gap-0.5" title={`Connected Web Link: ${e.webLinkAttachment.domain}`}>
                        <LinkIcon className="w-2.5 h-2.5" />
                        Link
                      </span>
                    )}
                    {e.photoAttachment && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/40 rounded text-amber-300 flex items-center gap-0.5" title="Attached Photo Context">
                        <ImageIcon className="w-2.5 h-2.5" />
                        Photo
                      </span>
                    )}
                    {e.fileAttachment && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-300 flex items-center gap-0.5" title={`Attached Document: ${e.fileAttachment.fileName}`}>
                        <FileText className="w-2.5 h-2.5" />
                        Doc
                      </span>
                    )}
                    {e.spotifyAttachment && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-400 flex items-center gap-0.5" title={`Connected Spotify Track: ${e.spotifyAttachment.trackName || 'Music'}`}>
                        <Music className="w-2.5 h-2.5" />
                        Music
                      </span>
                    )}
                    {e.aiResponse && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI Reflect
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(evt) => {
                      evt.stopPropagation();
                      setEntryToDelete(e.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-rose-400 transition-opacity cursor-pointer"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 max-w-xs w-full text-stone-200">
            <h4 className="font-bold text-sm text-stone-100 mb-2">Delete Reflection?</h4>
            <p className="text-xs text-stone-400 mb-4">
              This action cannot be undone. This entry will be removed from your private Firestore partition.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="pt-3 mt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
        <span className="text-stone-500">Export:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            title="Download full Markdown journal archive"
          >
            <Download className="w-3 h-3" />
            <span>Markdown</span>
          </button>
          <span className="text-stone-700">|</span>
          <button
            onClick={handleExportJSON}
            className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            title="Download raw JSON data"
          >
            <Download className="w-3 h-3" />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
