import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Video, 
  Globe, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Calendar, 
  GitBranch, 
  Trash2, 
  RefreshCw,
  Clock,
  HardDrive
} from 'lucide-react';
import { YouTubeAttachment, WebLinkAttachment, PhotoAttachment, FileAttachment } from '../types';
import { getDocumentTypeLabel, formatFileSize } from '../lib/documentParser';

export type ContextType = 'youtube' | 'weblink' | 'photo' | 'file' | 'spotify' | 'calendar' | 'github';

export interface GenericContextItem {
  id: string;
  type: ContextType;
  label: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  accent: {
    iconColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    cardBorder: string;
    cardHover: string;
  };
  youtubeData?: YouTubeAttachment;
  webLinkData?: WebLinkAttachment;
  photoData?: PhotoAttachment;
  fileData?: FileAttachment;
  genericData?: {
    description?: string;
    url?: string;
    metadata?: Record<string, string>;
  };
  onRemove: () => void;
  onReplace?: () => void;
  onUpdateCaption?: (caption: string) => void;
}

interface ContextDetailModalProps {
  context: GenericContextItem | null;
  isOpen: boolean;
  onClose: () => void;
}

// Client-side sanitization helpers for Web Link metadata to guarantee no raw JS or page state is displayed
const isHumanReadableClientText = (text?: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (clean.length < 3) return false;

  const scriptKeywords = [
    'ytplayer',
    'client_canary_state',
    'ytcfg',
    'webpackchunk',
    '__next_data__',
    'window.',
    'document.',
    'function(',
    'function (',
    'void 0',
    'undefined',
    'eval(',
    'json.parse',
    'json.stringify',
    'localstorage',
    'sessionstorage',
    'addeventlistener',
    'prototype',
    'constructor',
    '<!doctype',
    '<html',
    '<script',
    '<style',
    '<meta',
    '</',
    'var ',
    'const ',
    'let ',
    'return ',
    'typeof ',
    '===',
    '!==',
    '=>',
  ];

  const lower = clean.toLowerCase();
  for (const kw of scriptKeywords) {
    if (lower.includes(kw)) {
      return false;
    }
  }

  if (/<[a-z][\s\S]*>/i.test(clean)) return false;
  if ((clean.startsWith('{') && clean.endsWith('}')) || (clean.startsWith('[') && clean.endsWith(']'))) return false;
  if (/["']?[a-zA-Z0-9_$]+["']?\s*:\s*["'{[]/.test(clean)) return false;
  if (/[;{}]{2,}/.test(clean)) return false;

  return true;
};

const getCleanWebSummary = (desc?: string, domain?: string): string => {
  if (desc && isHumanReadableClientText(desc)) {
    return desc;
  }
  if (domain && (domain.includes('youtube.com') || domain.includes('youtu.be'))) {
    return 'YouTube video page context attached to reflection.';
  }
  return 'Web page context attached to reflection.';
};

const getCleanWebTitle = (title?: string, domain?: string): string => {
  if (title && isHumanReadableClientText(title)) {
    return title;
  }
  if (domain && (domain.includes('youtube.com') || domain.includes('youtu.be'))) {
    return 'YouTube Video';
  }
  return domain || 'Attached Web Page';
};

export const ContextDetailModal: React.FC<ContextDetailModalProps> = ({
  context,
  isOpen,
  onClose,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [editingCaption, setEditingCaption] = useState('');

  useEffect(() => {
    if (context?.photoData?.caption !== undefined) {
      setEditingCaption(context.photoData.caption || '');
    } else {
      setEditingCaption('');
    }
  }, [context]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !context) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const renderTypeIcon = (type: ContextType) => {
    switch (type) {
      case 'youtube':
        return <Video className="w-4 h-4 text-red-400" />;
      case 'weblink':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-amber-400" />;
      case 'file':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'spotify':
        return <Music className="w-4 h-4 text-emerald-400" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'github':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      default:
        return <Globe className="w-4 h-4 text-stone-400" />;
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      id="context-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="context-detail-modal"
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 relative my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/80 bg-stone-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl border ${context.accent.badgeBg} ${context.accent.badgeBorder}`}>
              {renderTypeIcon(context.type)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${context.accent.badgeText}`}>
                  {context.label} Context
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                  Active Attachment
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {context.subtitle || 'Grounding your journal reflection'}
              </p>
            </div>
          </div>

          <button
            id="close-context-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Custom to each context type */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {/* YouTube Video Context */}
          {context.type === 'youtube' && context.youtubeData && (
            <div className="space-y-4">
              {context.youtubeData.thumbnailUrl && (
                <div className="relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 group">
                  <img
                    src={context.youtubeData.thumbnailUrl}
                    alt={context.youtubeData.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-48 sm:h-56 object-cover"
                  />
                  <a
                    href={context.youtubeData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6 ml-0.5" />
                    </div>
                  </a>
                </div>
              )}

              <div>
                <h4 className="text-base font-semibold text-stone-100 leading-snug">
                  {context.youtubeData.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-1.5">
                  <span className="text-stone-300 font-medium">{context.youtubeData.channelTitle || 'YouTube'}</span>
                  {context.youtubeData.attachedAt && (
                    <span className="flex items-center gap-1 text-[11px] text-stone-500">
                      <Clock className="w-3 h-3" />
                      {new Date(context.youtubeData.attachedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {context.youtubeData.timestampNote && (
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl">
                  <span className="text-[11px] font-semibold text-red-400 block mb-1">Timestamp Note</span>
                  <p className="text-xs text-stone-300">{context.youtubeData.timestampNote}</p>
                </div>
              )}

              <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl text-xs space-y-1">
                <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-semibold">Video URL</span>
                <a
                  href={context.youtubeData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:underline break-all block font-mono text-[11px]"
                >
                  {context.youtubeData.url}
                </a>
              </div>
            </div>
          )}

          {/* Web Link Context */}
          {context.type === 'weblink' && context.webLinkData && (
            <div className="space-y-4">
              {context.webLinkData.imageUrl && (
                <div className="rounded-xl overflow-hidden bg-stone-950 border border-stone-800">
                  <img
                    src={context.webLinkData.imageUrl}
                    alt={getCleanWebTitle(context.webLinkData.title, context.webLinkData.domain)}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              <div>
                <span className="inline-block text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded mb-1.5">
                  {context.webLinkData.domain || 'web'}
                </span>
                <h4 className="text-base font-semibold text-stone-100 leading-snug break-words">
                  {getCleanWebTitle(context.webLinkData.title, context.webLinkData.domain)}
                </h4>
              </div>

              {/* Domain / Site Section */}
              <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl">
                <span className="text-[11px] font-semibold text-cyan-400 block mb-1">Domain / Site</span>
                <p className="text-xs text-stone-200 font-mono break-all">
                  {context.webLinkData.domain || 'web'}
                </p>
              </div>

              {/* Page Summary Section */}
              <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl">
                <span className="text-[11px] font-semibold text-cyan-400 block mb-1">Page Summary</span>
                <p className="text-xs text-stone-300 leading-relaxed break-words">
                  {getCleanWebSummary(context.webLinkData.description, context.webLinkData.domain)}
                </p>
              </div>

              {/* Web URL Section */}
              <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl text-xs space-y-1">
                <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-semibold">Web URL</span>
                <a
                  href={context.webLinkData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline break-all block font-mono text-[11px]"
                >
                  {context.webLinkData.url}
                </a>
              </div>
            </div>
          )}

          {/* Photo Context */}
          {context.type === 'photo' && context.photoData && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center p-1">
                <img
                  src={context.photoData.url}
                  alt={context.photoData.caption || context.photoData.fileName || 'Journal Photo'}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[48vh] object-contain rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300 block">
                  Photo Caption
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add or update caption..."
                    value={editingCaption}
                    onChange={(e) => {
                      setEditingCaption(e.target.value);
                      if (context.onUpdateCaption) {
                        context.onUpdateCaption(e.target.value);
                      }
                    }}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                <div className="p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg">
                  <span className="text-stone-500 block mb-0.5">File Name</span>
                  <span className="text-stone-300 font-mono truncate block" title={context.photoData.fileName}>
                    {context.photoData.fileName || 'image.jpg'}
                  </span>
                </div>
                <div className="p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg">
                  <span className="text-stone-500 block mb-0.5">File Size</span>
                  <span className="text-stone-300 font-mono flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-stone-500" />
                    {context.photoData.sizeBytes ? `${Math.round(context.photoData.sizeBytes / 1024)} KB` : 'Optimized'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* File / Document Context */}
          {context.type === 'file' && context.fileData && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-950/80 border border-emerald-500/25 rounded-xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-0.5">
                    {getDocumentTypeLabel(context.fileData.fileType)}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-100 truncate" title={context.fileData.fileName}>
                    {context.fileData.fileName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                    <span className="text-stone-300 font-mono">{formatFileSize(context.fileData.sizeBytes)}</span>
                    {context.fileData.attachedAt && (
                      <span className="text-stone-500 text-[11px]">
                        • {new Date(context.fileData.attachedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {context.fileData.description && (
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl">
                  <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Document Note / Purpose</span>
                  <p className="text-xs text-stone-200 leading-relaxed break-words">
                    {context.fileData.description}
                  </p>
                </div>
              )}

              {/* Document Text Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-300 block">
                  Document Preview
                </span>
                {context.fileData.extractedText ? (
                  <div className="p-3.5 bg-stone-950 border border-stone-800/90 rounded-xl max-h-56 overflow-y-auto">
                    <pre className="text-xs text-stone-300 leading-relaxed font-mono whitespace-pre-wrap select-text">
                      {context.fileData.extractedText}
                    </pre>
                  </div>
                ) : (
                  <div className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-xl text-center">
                    <p className="text-xs text-stone-400 italic">
                      Text preview unavailable for this document. (File metadata attached to reflection)
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                <div className="p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg">
                  <span className="text-stone-500 block mb-0.5">File Format</span>
                  <span className="text-stone-300 font-mono uppercase truncate block">
                    .{context.fileData.fileType}
                  </span>
                </div>
                <div className="p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg">
                  <span className="text-stone-500 block mb-0.5">Attachment State</span>
                  <span className="text-emerald-400 font-medium truncate block">
                    Active Grounding Context
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generic / Future Types (Spotify, Calendar, GitHub) */}
          {!['youtube', 'weblink', 'photo', 'file'].includes(context.type) && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold text-stone-100 leading-snug">
                  {context.title}
                </h4>
                {context.subtitle && (
                  <p className="text-xs text-stone-400 mt-1">{context.subtitle}</p>
                )}
              </div>

              {context.genericData?.description && (
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl">
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {context.genericData.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-stone-800/80 bg-stone-950/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              id="modal-remove-context-btn"
              type="button"
              onClick={() => {
                context.onRemove();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Context</span>
            </button>

            {context.type === 'photo' && context.onReplace && (
              <button
                id="modal-replace-photo-btn"
                type="button"
                onClick={() => {
                  onClose();
                  context.onReplace?.();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-300 hover:text-amber-300 hover:bg-stone-800 border border-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {context.type === 'file' && context.fileData?.dataUrl && (
              <a
                id="modal-download-file-btn"
                href={context.fileData.dataUrl}
                download={context.fileData.fileName || 'document'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Download / Open</span>
              </a>
            )}

            {context.type === 'youtube' && context.youtubeData && (
              <a
                id="modal-watch-youtube-btn"
                href={context.youtubeData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Watch Video</span>
              </a>
            )}

            {context.type === 'weblink' && context.webLinkData && (
              <a
                id="modal-open-weblink-btn"
                href={context.webLinkData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Link</span>
              </a>
            )}

            <button
              id="modal-done-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
