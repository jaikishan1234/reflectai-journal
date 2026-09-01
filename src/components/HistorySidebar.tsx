import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { Search, Plus, Trash2, Calendar, Download, Sparkles, Filter, Smile, Video, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

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
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMood = selectedMoodFilter === 'all' || e.mood === selectedMoodFilter;
      return matchSearch && matchMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

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

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col h-full shadow-lg">
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
      <div className="relative mb-2.5">
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

      {/* Mood Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-3 scrollbar-none text-[10px]">
        <button
          onClick={() => setSelectedMoodFilter('all')}
          className={`px-2 py-0.5 rounded-md border shrink-0 transition-colors cursor-pointer ${
            selectedMoodFilter === 'all'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
          }`}
        >
          All Moods
        </button>
        {['thoughtful', 'motivated', 'peaceful', 'anxious', 'energized', 'overwhelmed'].map(m => (
          <button
            key={m}
            onClick={() => setSelectedMoodFilter(m)}
            className={`px-2 py-0.5 rounded-md border shrink-0 transition-colors capitalize cursor-pointer ${
              selectedMoodFilter === m
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[500px]">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            <p>No journal entries match your filter.</p>
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
