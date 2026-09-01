import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Sparkles, CheckSquare, Square, Lightbulb, Copy, Check, ShieldCheck, CornerDownRight, Video, ExternalLink, Globe, Link as LinkIcon, Image as ImageIcon, FileText, Music } from 'lucide-react';
import { JournalEntry } from '../types';

interface ReflectionCardProps {
  entry: JournalEntry;
  onAskFollowUp: (question: string) => void;
}

const isHumanReadableClientText = (text?: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (clean.length < 3) return false;
  const lower = clean.toLowerCase();
  const scriptKeywords = ['ytplayer', 'client_canary_state', 'ytcfg', 'webpackchunk', '__next_data__', 'window.', 'document.', 'function(', '<script', '</', 'var ', 'const ', 'let '];
  for (const kw of scriptKeywords) {
    if (lower.includes(kw)) return false;
  }
  if (/<[a-z][\s\S]*>/i.test(clean)) return false;
  if ((clean.startsWith('{') && clean.endsWith('}')) || (clean.startsWith('[') && clean.endsWith(']'))) return false;
  return true;
};

export const ReflectionCard: React.FC<ReflectionCardProps> = ({ entry, onAskFollowUp }) => {
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  if (!entry.aiResponse) return null;

  const toggleActionItem = (index: number) => {
    setCompletedItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.aiResponse || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendQuickQuestion = () => {
    if (!quickInput.trim()) return;
    onAskFollowUp(quickInput.trim());
    setQuickInput('');
  };

  return (
    <div 
      id="gemini-reflection-card"
      className="w-full bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl relative mt-6"
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-stone-800/80 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-stone-100">Gemini AI Reflection & Guidance</h3>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Firestore Isolated
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Personalized to your mood and journaling context</p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          id="copy-gemini-reflection-btn"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs rounded-lg border border-stone-700 transition-colors cursor-pointer"
          title="Copy response to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Attached YouTube Context Preview if present */}
      {entry.youtubeAttachment && (
        <div className="mb-4 p-3 bg-stone-950/70 border border-red-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {entry.youtubeAttachment.thumbnailUrl ? (
              <img
                src={entry.youtubeAttachment.thumbnailUrl}
                alt={entry.youtubeAttachment.title}
                referrerPolicy="no-referrer"
                className="w-14 h-10 rounded-lg object-cover bg-stone-900 border border-stone-800 shrink-0"
              />
            ) : (
              <div className="w-14 h-10 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-red-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                <Video className="w-3 h-3" />
                <span>Connected YouTube Context</span>
              </div>
              <h4 className="text-xs font-semibold text-stone-200 truncate mt-0.5" title={entry.youtubeAttachment.title}>
                {entry.youtubeAttachment.title}
              </h4>
              <div className="text-[11px] text-stone-400 truncate">
                {entry.youtubeAttachment.channelTitle || 'YouTube'}
                {entry.youtubeAttachment.timestampNote && ` • Note: ${entry.youtubeAttachment.timestampNote}`}
              </div>
            </div>
          </div>

          <a
            href={entry.youtubeAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-md transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>
        </div>
      )}

      {/* Attached Web Link Context Preview if present */}
      {entry.webLinkAttachment && (
        <div className="mb-4 p-3 bg-stone-950/70 border border-cyan-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {entry.webLinkAttachment.imageUrl ? (
              <img
                src={entry.webLinkAttachment.imageUrl}
                alt={entry.webLinkAttachment.title}
                referrerPolicy="no-referrer"
                className="w-14 h-10 rounded-lg object-cover bg-stone-900 border border-stone-800 shrink-0"
              />
            ) : (
              <div className="w-14 h-10 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1 uppercase tracking-wider">
                <LinkIcon className="w-3 h-3" />
                <span>Connected Web Link Context</span>
              </div>
              <h4 className="text-xs font-semibold text-stone-200 truncate mt-0.5" title={entry.webLinkAttachment.title}>
                {entry.webLinkAttachment.title}
              </h4>
              <div className="text-[11px] text-stone-400 truncate">
                <span className="text-cyan-300 font-mono">{entry.webLinkAttachment.domain}</span>
                {entry.webLinkAttachment.description && isHumanReadableClientText(entry.webLinkAttachment.description) && ` • ${entry.webLinkAttachment.description}`}
              </div>
            </div>
          </div>

          <a
            href={entry.webLinkAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-stone-400 hover:text-cyan-200 bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-md transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>
        </div>
      )}

      {/* Attached Photo Context Preview if present */}
      {entry.photoAttachment && (
        <div className="mb-4 p-3 bg-stone-950/70 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={entry.photoAttachment.url}
              alt={entry.photoAttachment.caption || 'Connected Journal Photo'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-lg object-cover bg-stone-900 border border-stone-800 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                <ImageIcon className="w-3 h-3" />
                <span>Connected Photo Context</span>
              </div>
              <h4 className="text-xs font-semibold text-stone-200 truncate mt-0.5" title={entry.photoAttachment.caption || 'Attached moment'}>
                {entry.photoAttachment.caption ? `"${entry.photoAttachment.caption}"` : (entry.photoAttachment.fileName || 'Attached Memory Photo')}
              </h4>
              <div className="text-[11px] text-stone-400 truncate">
                Visual reflection keepsake
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attached File Context Preview if present */}
      {entry.fileAttachment && (
        <div className="mb-4 p-3 bg-stone-950/70 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                <span>Attached Document ({entry.fileAttachment.fileType?.toUpperCase()})</span>
              </div>
              <h4 className="text-xs font-semibold text-stone-200 truncate mt-0.5" title={entry.fileAttachment.fileName}>
                {entry.fileAttachment.fileName}
              </h4>
              {entry.fileAttachment.description && (
                <div className="text-[11px] text-stone-400 truncate">
                  {entry.fileAttachment.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attached Spotify Music Context Preview if present */}
      {entry.spotifyAttachment && (
        <div className="mb-4 p-3 bg-stone-950/70 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {entry.spotifyAttachment.thumbnailUrl ? (
              <img
                src={entry.spotifyAttachment.thumbnailUrl}
                alt={entry.spotifyAttachment.trackName || 'Spotify artwork'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg object-cover bg-stone-900 border border-stone-800 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                <Music className="w-3 h-3" />
                <span>Connected Spotify Track</span>
              </div>
              <h4 className="text-xs font-semibold text-stone-200 truncate mt-0.5" title={entry.spotifyAttachment.trackName}>
                {entry.spotifyAttachment.trackName || 'Track'}
              </h4>
              <div className="text-[11px] text-stone-400 truncate">
                {entry.spotifyAttachment.artistName || 'Artist'}{entry.spotifyAttachment.albumName ? ` • ${entry.spotifyAttachment.albumName}` : ''}
              </div>
            </div>
          </div>

          <a
            href={entry.spotifyAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 rounded-md transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Spotify</span>
          </a>
        </div>
      )}

      {/* Key Insights Chips if available */}
      {entry.aiKeyInsights && entry.aiKeyInsights.length > 0 && (
        <div className="mb-5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Key Observations:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entry.aiKeyInsights.map((insight, idx) => (
              <div key={idx} className="text-xs text-stone-300 bg-stone-900/90 border border-stone-800 px-3 py-2 rounded-lg flex items-start gap-2">
                <span className="text-amber-400 shrink-0 font-mono">0{idx + 1}.</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Markdown Body */}
      <div className="text-stone-200 text-sm leading-relaxed space-y-3 prose prose-invert max-w-none prose-p:my-2 prose-headings:text-amber-300 prose-headings:font-bold prose-headings:text-base prose-ul:my-2 prose-li:my-0.5 prose-strong:text-stone-100">
        <Markdown>{entry.aiResponse}</Markdown>
      </div>

      {/* Action Items Checklist if available */}
      {entry.aiActionItems && entry.aiActionItems.length > 0 && (
        <div className="mt-6 pt-5 border-t border-stone-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 mb-2.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Actionable Takeaways:</span>
          </div>
          <div className="space-y-2">
            {entry.aiActionItems.map((item, idx) => {
              const isChecked = !!completedItems[idx];
              return (
                <button
                  key={idx}
                  onClick={() => toggleActionItem(idx)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-stone-400 line-through'
                      : 'bg-stone-950/80 border-stone-800 text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <span className="shrink-0 mt-0.5 text-emerald-400">
                    {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-stone-500" />}
                  </span>
                  <span className="leading-snug">{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Follow-up Question Starter */}
      <div className="mt-6 pt-4 border-t border-stone-800 flex items-center gap-2">
        <CornerDownRight className="w-4 h-4 text-stone-500 shrink-0" />
        <input
          type="text"
          placeholder="Ask a follow-up question about this reflection..."
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSendQuickQuestion();
            }
          }}
          className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50"
        />
        <button
          onClick={handleSendQuickQuestion}
          disabled={!quickInput.trim()}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0"
        >
          Ask
        </button>
      </div>
    </div>
  );
};
