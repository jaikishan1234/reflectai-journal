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
      className="w-full bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 mt-6 shadow-sm"
    >
      {/* Top Banner: Header, AI Indicator, Security Badge & Copy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#30383F] mb-6">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-4 h-4 text-[#4FA3D1]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base text-[#F4F1EA] tracking-tight">
                Gemini AI Reflection &amp; Guidance
              </h3>
              <span className="text-[10px] font-medium bg-[#171B1F] text-[#A7ADB2] border border-[#30383F] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3 h-3 text-[#3282B8]" />
                <span>Firestore Isolated</span>
              </span>
            </div>
            <p className="text-xs text-[#A7ADB2] mt-0.5">
              Personalized to your mood and journaling context
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          id="copy-gemini-reflection-btn"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171B1F] hover:bg-[#252C32] text-[#A7ADB2] hover:text-[#F4F1EA] text-xs font-medium rounded-lg border border-[#30383F] transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          title="Copy response to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#4FA3D1]" />
              <span className="text-[#4FA3D1] text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#747C82]" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Attached YouTube Context Preview if present */}
      {entry.youtubeAttachment && (
        <div className="mb-5 p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {entry.youtubeAttachment.thumbnailUrl ? (
              <img
                src={entry.youtubeAttachment.thumbnailUrl}
                alt={entry.youtubeAttachment.title}
                referrerPolicy="no-referrer"
                className="w-14 h-10 rounded-lg object-cover bg-[#111416] border border-[#30383F] shrink-0"
              />
            ) : (
              <div className="w-14 h-10 rounded-lg bg-[#252C32] border border-[#30383F] flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-[#4FA3D1]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[#4FA3D1] flex items-center gap-1 uppercase tracking-wider">
                <Video className="w-3 h-3" />
                <span>Connected YouTube Context</span>
              </div>
              <h4 className="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5" title={entry.youtubeAttachment.title}>
                {entry.youtubeAttachment.title}
              </h4>
              <div className="text-[11px] text-[#A7ADB2] truncate">
                {entry.youtubeAttachment.channelTitle || 'YouTube'}
                {entry.youtubeAttachment.timestampNote && ` • Note: ${entry.youtubeAttachment.timestampNote}`}
              </div>
            </div>
          </div>

          <a
            href={entry.youtubeAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#A7ADB2] hover:text-[#F4F1EA] bg-[#252C32] hover:bg-[#30383F] border border-[#30383F] rounded-lg transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>
        </div>
      )}

      {/* Attached Web Link Context Preview if present */}
      {entry.webLinkAttachment && (
        <div className="mb-5 p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {entry.webLinkAttachment.imageUrl ? (
              <img
                src={entry.webLinkAttachment.imageUrl}
                alt={entry.webLinkAttachment.title}
                referrerPolicy="no-referrer"
                className="w-14 h-10 rounded-lg object-cover bg-[#111416] border border-[#30383F] shrink-0"
              />
            ) : (
              <div className="w-14 h-10 rounded-lg bg-[#252C32] border border-[#30383F] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-[#4FA3D1]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[#4FA3D1] flex items-center gap-1 uppercase tracking-wider">
                <LinkIcon className="w-3 h-3" />
                <span>Connected Web Link Context</span>
              </div>
              <h4 className="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5" title={entry.webLinkAttachment.title}>
                {entry.webLinkAttachment.title}
              </h4>
              <div className="text-[11px] text-[#A7ADB2] truncate">
                <span className="text-[#BBE1FA] font-mono">{entry.webLinkAttachment.domain}</span>
                {entry.webLinkAttachment.description && isHumanReadableClientText(entry.webLinkAttachment.description) && ` • ${entry.webLinkAttachment.description}`}
              </div>
            </div>
          </div>

          <a
            href={entry.webLinkAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#A7ADB2] hover:text-[#F4F1EA] bg-[#252C32] hover:bg-[#30383F] border border-[#30383F] rounded-lg transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>
        </div>
      )}

      {/* Attached Photo Context Preview if present */}
      {entry.photoAttachment && (
        <div className="mb-5 p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={entry.photoAttachment.url}
              alt={entry.photoAttachment.caption || 'Connected Journal Photo'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-lg object-cover bg-[#111416] border border-[#30383F] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[#4FA3D1] flex items-center gap-1 uppercase tracking-wider">
                <ImageIcon className="w-3 h-3" />
                <span>Connected Photo Context</span>
              </div>
              <h4 className="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5" title={entry.photoAttachment.caption || 'Attached moment'}>
                {entry.photoAttachment.caption ? `"${entry.photoAttachment.caption}"` : (entry.photoAttachment.fileName || 'Attached Memory Photo')}
              </h4>
              <div className="text-[11px] text-[#A7ADB2] truncate">
                Visual reflection keepsake
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attached File Context Preview if present */}
      {entry.fileAttachment && (
        <div className="mb-5 p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-[#252C32] border border-[#30383F] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#4FA3D1]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[#4FA3D1] flex items-center gap-1 uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                <span>Attached Document ({entry.fileAttachment.fileType?.toUpperCase()})</span>
              </div>
              <h4 className="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5" title={entry.fileAttachment.fileName}>
                {entry.fileAttachment.fileName}
              </h4>
              {entry.fileAttachment.description && (
                <div className="text-[11px] text-[#A7ADB2] truncate">
                  {entry.fileAttachment.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attached Spotify Music Context Preview if present */}
      {entry.spotifyAttachment && (
        <div className="mb-5 p-3.5 bg-[#171B1F] border border-[#30383F] rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {entry.spotifyAttachment.thumbnailUrl ? (
              <img
                src={entry.spotifyAttachment.thumbnailUrl}
                alt={entry.spotifyAttachment.trackName || 'Spotify artwork'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg object-cover bg-[#111416] border border-[#30383F] shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#252C32] border border-[#30383F] flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-[#4FA3D1]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[#4FA3D1] flex items-center gap-1 uppercase tracking-wider">
                <Music className="w-3 h-3" />
                <span>Connected Spotify Track</span>
              </div>
              <h4 className="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5" title={entry.spotifyAttachment.trackName}>
                {entry.spotifyAttachment.trackName || 'Track'}
              </h4>
              <div className="text-[11px] text-[#A7ADB2] truncate">
                {entry.spotifyAttachment.artistName || 'Artist'}{entry.spotifyAttachment.albumName ? ` • ${entry.spotifyAttachment.albumName}` : ''}
              </div>
            </div>
          </div>

          <a
            href={entry.spotifyAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#A7ADB2] hover:text-[#F4F1EA] bg-[#252C32] hover:bg-[#30383F] border border-[#30383F] rounded-lg transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Spotify</span>
          </a>
        </div>
      )}

      {/* Observations (Key Insights) */}
      {entry.aiKeyInsights && entry.aiKeyInsights.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3282B8]" />
            <h4 className="text-xs font-semibold text-[#A7ADB2] uppercase tracking-wider">
              Observations
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {entry.aiKeyInsights.map((insight, idx) => (
              <div
                key={idx}
                className="text-xs text-[#F4F1EA] bg-[#171B1F] border border-[#30383F] px-3.5 py-2.5 rounded-xl flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-[#3282B8] shrink-0 font-mono text-[11px] font-semibold mt-0.5">
                  0{idx + 1}.
                </span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deeper Reflection (Markdown Body) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3282B8]" />
          <h4 className="text-xs font-semibold text-[#A7ADB2] uppercase tracking-wider">
            Deeper Reflection
          </h4>
        </div>
        <div className="text-[#F4F1EA] text-sm sm:text-[15px] leading-relaxed space-y-3 prose prose-invert max-w-none prose-p:my-2.5 prose-p:text-[#F4F1EA] prose-headings:text-[#F4F1EA] prose-headings:font-semibold prose-headings:text-base prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-li:my-0.5 prose-li:text-[#F4F1EA] prose-strong:text-[#F4F1EA] prose-strong:font-semibold prose-em:text-[#BBE1FA] prose-blockquote:border-l-[#3282B8] prose-blockquote:border-l-2 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-[#A7ADB2]">
          <Markdown>{entry.aiResponse}</Markdown>
        </div>
      </div>

      {/* Actionable Takeaways Checklist */}
      {entry.aiActionItems && entry.aiActionItems.length > 0 && (
        <div className="mb-6 pt-5 border-t border-[#30383F]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3282B8]" />
            <h4 className="text-xs font-semibold text-[#A7ADB2] uppercase tracking-wider">
              Actionable Takeaways
            </h4>
          </div>
          <div className="space-y-2">
            {entry.aiActionItems.map((item, idx) => {
              const isChecked = !!completedItems[idx];
              return (
                <button
                  key={idx}
                  onClick={() => toggleActionItem(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-[13px] flex items-start gap-3 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[#171B1F]/60 border-[#30383F] text-[#747C82] line-through'
                      : 'bg-[#171B1F] border-[#30383F] text-[#F4F1EA] hover:border-[#424B54] hover:bg-[#252C32]'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#3282B8]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#747C82]" />
                    )}
                  </span>
                  <span className="leading-snug">{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up Question Starter */}
      <div className="pt-5 border-t border-[#30383F]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3282B8]" />
          <h4 className="text-xs font-semibold text-[#A7ADB2] uppercase tracking-wider">
            Follow-up Question
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#171B1F] border border-[#30383F] focus-within:border-[#3282B8] rounded-xl p-1.5 transition-colors">
          <div className="flex items-center gap-2 flex-1 px-2 py-1 min-w-0">
            <CornerDownRight className="w-4 h-4 text-[#747C82] shrink-0" />
            <input
              id="gemini-followup-input"
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
              className="w-full bg-transparent text-xs sm:text-sm text-[#F4F1EA] placeholder-[#747C82] focus:outline-hidden"
            />
          </div>
          <button
            id="gemini-followup-send-btn"
            onClick={handleSendQuickQuestion}
            disabled={!quickInput.trim()}
            className="px-4 py-2 bg-[#3282B8] hover:bg-[#4FA3D1] text-white font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};
