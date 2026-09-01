import React, { useState, useMemo } from 'react';
import { 
  Video, 
  Globe, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  GitBranch, 
  X, 
  Layers
} from 'lucide-react';
import { YouTubeAttachment, WebLinkAttachment, PhotoAttachment, FileAttachment, SpotifyAttachment } from '../types';
import { ContextDetailModal, GenericContextItem, ContextType } from './ContextDetailModal';
import { formatFileSize, getDocumentTypeLabel } from '../lib/documentParser';

interface AttachedContextsGridProps {
  youtubeAttachment?: YouTubeAttachment | null;
  webLinkAttachment?: WebLinkAttachment | null;
  photoAttachment?: PhotoAttachment | null;
  fileAttachment?: FileAttachment | null;
  spotifyAttachment?: SpotifyAttachment | null;
  githubAttachment?: any;
  onRemoveYoutube: () => void;
  onRemoveWebLink: () => void;
  onRemovePhoto: () => void;
  onRemoveFile: () => void;
  onRemoveSpotify?: () => void;
  onReplacePhoto?: () => void;
  onUpdatePhotoCaption?: (caption: string) => void;
}

export const AttachedContextsGrid: React.FC<AttachedContextsGridProps> = ({
  youtubeAttachment,
  webLinkAttachment,
  photoAttachment,
  fileAttachment,
  spotifyAttachment,
  githubAttachment,
  onRemoveYoutube,
  onRemoveWebLink,
  onRemovePhoto,
  onRemoveFile,
  onRemoveSpotify,
  onReplacePhoto,
  onUpdatePhotoCaption,
}) => {
  const [selectedContext, setSelectedContext] = useState<GenericContextItem | null>(null);

  // Normalize attached contexts into a unified, extensible array
  const contextItems = useMemo<GenericContextItem[]>(() => {
    const items: GenericContextItem[] = [];

    // 1. YouTube Attachment
    if (youtubeAttachment) {
      items.push({
        id: `yt-${youtubeAttachment.videoId || 'yt'}`,
        type: 'youtube',
        label: 'YouTube',
        title: youtubeAttachment.title || 'Attached Video',
        subtitle: youtubeAttachment.channelTitle || 'YouTube',
        thumbnailUrl: youtubeAttachment.thumbnailUrl,
        accent: {
          iconColor: 'text-red-400',
          badgeBg: 'bg-red-950/40',
          badgeBorder: 'border-red-800/40',
          badgeText: 'text-red-400',
          cardBorder: 'border-red-500/25',
          cardHover: 'hover:border-red-500/45 hover:bg-red-950/15',
        },
        youtubeData: youtubeAttachment,
        onRemove: onRemoveYoutube,
      });
    }

    // 2. Web Link Attachment
    if (webLinkAttachment) {
      items.push({
        id: `web-${webLinkAttachment.url}`,
        type: 'weblink',
        label: 'Web Link',
        title: webLinkAttachment.title || webLinkAttachment.domain || 'Attached Web Page',
        subtitle: webLinkAttachment.domain || 'Web',
        thumbnailUrl: webLinkAttachment.imageUrl,
        accent: {
          iconColor: 'text-cyan-400',
          badgeBg: 'bg-cyan-950/40',
          badgeBorder: 'border-cyan-800/40',
          badgeText: 'text-cyan-400',
          cardBorder: 'border-cyan-500/25',
          cardHover: 'hover:border-cyan-500/45 hover:bg-cyan-950/15',
        },
        webLinkData: webLinkAttachment,
        onRemove: onRemoveWebLink,
      });
    }

    // 3. Photo Attachment
    if (photoAttachment) {
      items.push({
        id: `photo-${photoAttachment.fileName || 'photo'}`,
        type: 'photo',
        label: 'Photo',
        title: photoAttachment.caption || photoAttachment.fileName || 'Attached Photo',
        subtitle: photoAttachment.fileName ? `${photoAttachment.fileName}` : 'Visual keepsake',
        thumbnailUrl: photoAttachment.url,
        accent: {
          iconColor: 'text-amber-400',
          badgeBg: 'bg-amber-950/40',
          badgeBorder: 'border-amber-800/40',
          badgeText: 'text-amber-400',
          cardBorder: 'border-amber-500/25',
          cardHover: 'hover:border-amber-500/45 hover:bg-amber-950/15',
        },
        photoData: photoAttachment,
        onRemove: onRemovePhoto,
        onReplace: onReplacePhoto,
        onUpdateCaption: onUpdatePhotoCaption,
      });
    }

    // 4. File / Document Attachment
    if (fileAttachment) {
      items.push({
        id: `file-${fileAttachment.fileName}`,
        type: 'file',
        label: 'File',
        title: fileAttachment.description || fileAttachment.fileName || 'Attached Document',
        subtitle: `${fileAttachment.fileType?.toUpperCase() || 'FILE'} • ${formatFileSize(fileAttachment.sizeBytes)}`,
        accent: {
          iconColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-950/40',
          badgeBorder: 'border-emerald-800/40',
          badgeText: 'text-emerald-400',
          cardBorder: 'border-emerald-500/25',
          cardHover: 'hover:border-emerald-500/45 hover:bg-emerald-950/15',
        },
        fileData: fileAttachment,
        onRemove: onRemoveFile,
      });
    }

    // 5. Spotify / Music Attachment
    if (spotifyAttachment) {
      items.push({
        id: `spotify-${spotifyAttachment.trackId || spotifyAttachment.url}`,
        type: 'spotify',
        label: 'Spotify',
        title: spotifyAttachment.trackName || 'Attached Track',
        subtitle: spotifyAttachment.artistName ? `${spotifyAttachment.artistName}` : 'Spotify',
        thumbnailUrl: spotifyAttachment.thumbnailUrl,
        accent: {
          iconColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-950/40',
          badgeBorder: 'border-emerald-800/40',
          badgeText: 'text-emerald-400',
          cardBorder: 'border-emerald-500/25',
          cardHover: 'hover:border-emerald-500/45 hover:bg-emerald-950/15',
        },
        spotifyData: spotifyAttachment,
        onRemove: onRemoveSpotify || (() => {}),
      });
    }

    if (githubAttachment) {
      items.push({
        id: 'github-ctx',
        type: 'github',
        label: 'GitHub',
        title: githubAttachment.repo || 'Repository',
        subtitle: githubAttachment.branch || 'Code',
        accent: {
          iconColor: 'text-purple-400',
          badgeBg: 'bg-purple-950/40',
          badgeBorder: 'border-purple-800/40',
          badgeText: 'text-purple-400',
          cardBorder: 'border-purple-500/25',
          cardHover: 'hover:border-purple-500/45 hover:bg-purple-950/15',
        },
        onRemove: () => {},
      });
    }

    return items;
  }, [
    youtubeAttachment,
    webLinkAttachment,
    photoAttachment,
    fileAttachment,
    spotifyAttachment,
    githubAttachment,
    onRemoveYoutube,
    onRemoveWebLink,
    onRemovePhoto,
    onRemoveFile,
    onRemoveSpotify,
    onReplacePhoto,
    onUpdatePhotoCaption,
  ]);

  if (contextItems.length === 0) {
    return null;
  }

  const renderContextIcon = (type: ContextType) => {
    switch (type) {
      case 'youtube':
        return <Video className="w-3.5 h-3.5 text-red-400" />;
      case 'weblink':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'photo':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
      case 'file':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'spotify':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'github':
        return <GitBranch className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  return (
    <div id="attached-contexts-section" className="mb-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5 px-0.5">
        {/* Left Group: Icon + Label + Count Badge */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-stone-200 leading-none">
            Attached Contexts
          </span>
          <span 
            id="attached-contexts-count-badge"
            className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold font-mono text-amber-300 bg-stone-900 border border-stone-800 rounded-md leading-none shadow-2xs"
          >
            {contextItems.length}
          </span>
        </div>

        {/* Right Group: Helper Text */}
        <span className="text-[11px] text-stone-500 hidden sm:inline-block leading-none">
          Click any card for full details
        </span>
      </div>

      {/* Responsive Grid */}
      <div 
        id="attached-contexts-grid"
        className={`grid gap-2.5 w-full ${
          contextItems.length === 1 
            ? 'grid-cols-1 max-w-md' 
            : contextItems.length === 2 
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {contextItems.map((item) => (
          <div
            key={item.id}
            id={`context-chip-${item.type}`}
            onClick={() => setSelectedContext(item)}
            className={`group relative flex items-center justify-between gap-2.5 px-2.5 py-1.5 h-14 w-full bg-stone-950/85 border ${item.accent.cardBorder} ${item.accent.cardHover} rounded-xl transition-all cursor-pointer shadow-xs overflow-hidden select-none`}
            title={`Click to view full ${item.label} details`}
          >
            {/* Left: Fixed Dimension Thumbnail or Icon */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              {item.thumbnailUrl ? (
                <div className="relative w-9 h-9 min-w-[36px] max-w-[36px] h-9 min-h-[36px] max-h-[36px] rounded-lg overflow-hidden bg-stone-900 border border-stone-800 shrink-0 aspect-square">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              ) : (
                <div className={`w-9 h-9 min-w-[36px] max-w-[36px] h-9 min-h-[36px] max-h-[36px] rounded-lg border ${item.accent.badgeBg} ${item.accent.badgeBorder} flex items-center justify-center shrink-0 aspect-square`}>
                  {renderContextIcon(item.type)}
                </div>
              )}

              {/* Middle: Type & Short Info (Strictly Truncated) */}
              <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden leading-none">
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${item.accent.badgeText}`}>
                    {item.label}
                  </span>
                  {item.subtitle && (
                    <span className="text-[10px] text-stone-500 truncate min-w-0">
                      • {item.subtitle}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-stone-200 truncate mt-1 leading-snug" title={item.title}>
                  {item.title}
                </p>
              </div>
            </div>

            {/* Right: Remove (×) Button */}
            <button
              id={`remove-context-${item.type}-btn`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                item.onRemove();
              }}
              className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-900 rounded-md transition-colors cursor-pointer shrink-0 ml-0.5"
              title={`Remove ${item.label} context`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Reusable Context Detail Modal */}
      <ContextDetailModal
        context={selectedContext}
        isOpen={!!selectedContext}
        onClose={() => setSelectedContext(null)}
      />
    </div>
  );
};
