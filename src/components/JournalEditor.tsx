import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, ReflectionMode, YouTubeAttachment, WebLinkAttachment, PhotoAttachment, FileAttachment, SpotifyAttachment } from '../types';
import { Sparkles, Save, Tag, Smile, Lightbulb, RotateCw, AlertCircle, Video, Plus, X, ExternalLink, Clock, Link as LinkIcon, Globe, Image as ImageIcon, FileText, Music } from 'lucide-react';
import { AttachedContextsGrid } from './AttachedContextsGrid';
import { isSupportedDocument, extractDocumentText, formatFileSize, readFileAsDataUrl } from '../lib/documentParser';

interface JournalEditorProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => void;
  onGenerateAI: (entry: JournalEntry, mode: ReflectionMode) => void;
  isGeneratingAI: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

const MOOD_OPTIONS = [
  { value: 'thoughtful', label: 'Thoughtful 💭', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
  { value: 'motivated', label: 'Motivated 🚀', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { value: 'peaceful', label: 'Peaceful 🌿', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  { value: 'energized', label: 'Energized ⚡', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' },
  { value: 'anxious', label: 'Anxious 🌧️', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
  { value: 'overwhelmed', label: 'Overwhelmed 🌪️', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
] as const;

const REFLECTION_MODES: Array<{ id: ReflectionMode; label: string; icon: string; desc: string }> = [
  { id: 'reflect', label: 'Reflect & Guide', icon: '✨', desc: 'Empathetic feedback and introspective questions' },
  { id: 'summarize', label: 'Summarize & Themes', icon: '📝', desc: 'Core takeaways and key patterns' },
  { id: 'brainstorm', label: 'Brainstorm Ideas', icon: '💡', desc: 'Fresh perspectives and creative solutions' },
  { id: 'action_plan', label: '3-Step Action Plan', icon: '🎯', desc: 'Concrete milestones and next moves' },
  { id: 'wellness', label: 'Wellness Check', icon: '🌱', desc: 'Gentle grounding and emotional support' },
];

const PROMPT_STARTERS = [
  'What is the single most important thing on my mind right now?',
  'A challenging decision I am currently navigating...',
  'What brought me genuine energy or satisfaction today?',
  'Where am I feeling friction or resistance, and why?',
];

// Helper to optimize and downscale image client-side for reliable local & cloud persistence
const optimizeImageFile = (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, width: img.width, height: img.height });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : (file.type === 'image/gif' ? 'image/gif' : 'image/jpeg');
        const quality = mimeType === 'image/jpeg' ? 0.85 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({ dataUrl, width, height });
      };
      img.onerror = () => reject(new Error('Failed to parse selected image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onSave,
  onGenerateAI,
  isGeneratingAI,
  errorMessage,
  onClearError,
}) => {
  const [title, setTitle] = useState(entry.title || '');
  const [content, setContent] = useState(entry.content || '');
  const [mood, setMood] = useState(entry.mood || 'thoughtful');
  const [mode, setMode] = useState<ReflectionMode>(entry.mode || 'reflect');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // YouTube Context Attachment State
  const [youtubeAttachment, setYoutubeAttachment] = useState<YouTubeAttachment | null>(entry.youtubeAttachment || null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [timestampNoteInput, setTimestampNoteInput] = useState(entry.youtubeAttachment?.timestampNote || '');
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  // Web Link Context Attachment State
  const [webLinkAttachment, setWebLinkAttachment] = useState<WebLinkAttachment | null>(entry.webLinkAttachment || null);
  const [showWebLinkInput, setShowWebLinkInput] = useState(false);
  const [webUrlInput, setWebUrlInput] = useState('');
  const [isLoadingWebLink, setIsLoadingWebLink] = useState(false);
  const [webLinkError, setWebLinkError] = useState<string | null>(null);

  // Photo Context Attachment State
  const [photoAttachment, setPhotoAttachment] = useState<PhotoAttachment | null>(entry.photoAttachment || null);
  const [stagedPhoto, setStagedPhoto] = useState<PhotoAttachment | null>(null);
  const [photoCaptionInput, setPhotoCaptionInput] = useState(entry.photoAttachment?.caption || '');
  const [photoError, setPhotoError] = useState<string | null>(null);

  // File / Document Context Attachment State
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(entry.fileAttachment || null);
  const [stagedFile, setStagedFile] = useState<FileAttachment | null>(null);
  const [fileDescriptionInput, setFileDescriptionInput] = useState(entry.fileAttachment?.description || '');
  const [fileError, setFileError] = useState<string | null>(null);

  // Spotify / Music Context Attachment State
  const [spotifyAttachment, setSpotifyAttachment] = useState<SpotifyAttachment | null>(entry.spotifyAttachment || null);
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!isContextMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setIsContextMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isContextMenuOpen]);

  // Sync internal state when active entry changes
  useEffect(() => {
    setTitle(entry.title || '');
    setContent(entry.content || '');
    setMood(entry.mood || 'thoughtful');
    setMode(entry.mode || 'reflect');
    setTags(entry.tags || []);
    setYoutubeAttachment(entry.youtubeAttachment || null);
    setTimestampNoteInput(entry.youtubeAttachment?.timestampNote || '');
    setShowYoutubeInput(false);
    setYoutubeUrlInput('');
    setYoutubeError(null);

    setWebLinkAttachment(entry.webLinkAttachment || null);
    setShowWebLinkInput(false);
    setWebUrlInput('');
    setWebLinkError(null);

    setPhotoAttachment(entry.photoAttachment || null);
    setStagedPhoto(null);
    setPhotoCaptionInput(entry.photoAttachment?.caption || '');
    setPhotoError(null);

    setFileAttachment(entry.fileAttachment || null);
    setStagedFile(null);
    setFileDescriptionInput(entry.fileAttachment?.description || '');
    setFileError(null);

    setSpotifyAttachment(entry.spotifyAttachment || null);
    setShowSpotifyInput(false);
    setSpotifyUrlInput('');
    setSpotifyError(null);

    setIsContextMenuOpen(false);
    setHasUnsavedChanges(false);
  }, [entry.id]);

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (newVal: string) => {
    setTitle(newVal);
    setHasUnsavedChanges(true);
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed];
      setTags(updated);
      setNewTag('');
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    setHasUnsavedChanges(true);
  };

  const handleFetchYoutubeMetadata = async () => {
    const rawUrl = youtubeUrlInput.trim();
    if (!rawUrl) {
      setYoutubeError('Please enter a YouTube video URL.');
      return;
    }

    setIsLoadingYoutube(true);
    setYoutubeError(null);

    try {
      const response = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve YouTube metadata.');
      }

      const attachment: YouTubeAttachment = {
        videoId: data.videoId,
        url: data.url,
        title: data.title,
        channelTitle: data.channelTitle,
        thumbnailUrl: data.thumbnailUrl,
        authorUrl: data.authorUrl,
        timestampNote: timestampNoteInput.trim() || undefined,
        attachedAt: new Date().toISOString(),
      };

      setYoutubeAttachment(attachment);
      setShowYoutubeInput(false);
      setYoutubeUrlInput('');
      setHasUnsavedChanges(true);
    } catch (err: any) {
      setYoutubeError(err.message || 'Could not attach video. Please verify the URL.');
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const handleRemoveYoutubeAttachment = () => {
    setYoutubeAttachment(null);
    setTimestampNoteInput('');
    setHasUnsavedChanges(true);
  };

  const handleTimestampNoteChange = (note: string) => {
    setTimestampNoteInput(note);
    if (youtubeAttachment) {
      setYoutubeAttachment({
        ...youtubeAttachment,
        timestampNote: note.trim() || undefined,
      });
      setHasUnsavedChanges(true);
    }
  };

  const handleFetchWebLinkMetadata = async () => {
    const rawUrl = webUrlInput.trim();
    if (!rawUrl) {
      setWebLinkError('Please enter a web link URL.');
      return;
    }

    if (!/^https?:\/\//i.test(rawUrl)) {
      setWebLinkError('Please enter a valid URL starting with http:// or https:// (e.g. https://example.com/article)');
      return;
    }

    setIsLoadingWebLink(true);
    setWebLinkError(null);

    try {
      const response = await fetch('/api/web/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch web link metadata.');
      }

      const attachment: WebLinkAttachment = {
        url: data.url,
        title: data.title,
        description: data.description,
        domain: data.domain,
        imageUrl: data.imageUrl,
        extractedSnippet: data.extractedSnippet,
        attachedAt: new Date().toISOString(),
      };

      setWebLinkAttachment(attachment);
      setShowWebLinkInput(false);
      setWebUrlInput('');
      setHasUnsavedChanges(true);
    } catch (err: any) {
      setWebLinkError(err.message || 'Could not attach link. Please check the URL.');
    } finally {
      setIsLoadingWebLink(false);
    }
  };

  const handleRemoveWebLinkAttachment = () => {
    setWebLinkAttachment(null);
    setHasUnsavedChanges(true);
  };

  // Spotify / Music Handlers
  const handleFetchSpotifyMetadata = async () => {
    const rawUrl = spotifyUrlInput.trim();
    if (!rawUrl) {
      setSpotifyError('Please enter a Spotify track URL.');
      return;
    }

    if (!rawUrl.includes('spotify.com') && !rawUrl.startsWith('spotify:')) {
      setSpotifyError('Please enter a valid Spotify track URL (e.g. https://open.spotify.com/track/...)');
      return;
    }

    setIsLoadingSpotify(true);
    setSpotifyError(null);

    try {
      const response = await fetch('/api/spotify/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Spotify track metadata.');
      }

      const attachment: SpotifyAttachment = {
        url: data.url,
        trackId: data.trackId,
        trackName: data.trackName,
        artistName: data.artistName,
        albumName: data.albumName,
        thumbnailUrl: data.thumbnailUrl,
        durationMs: data.durationMs,
        durationFormatted: data.durationFormatted,
        releaseDate: data.releaseDate,
        isExplicit: data.isExplicit,
        attachedAt: new Date().toISOString(),
      };

      setSpotifyAttachment(attachment);
      setShowSpotifyInput(false);
      setSpotifyUrlInput('');
      setHasUnsavedChanges(true);
    } catch (err: any) {
      setSpotifyError(err.message || 'Could not attach Spotify track. Please check the URL.');
    } finally {
      setIsLoadingSpotify(false);
    }
  };

  const handleRemoveSpotifyAttachment = () => {
    setSpotifyAttachment(null);
    setHasUnsavedChanges(true);
  };

  // Photo Selection and Staging Handlers
  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setPhotoError(null);

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setPhotoError('Please choose a valid image format (JPG, PNG, WebP, or GIF).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate File Size (limit to 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Selected image is too large (exceeds 8MB). Please choose a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const { dataUrl } = await optimizeImageFile(file);
      const stagedCandidate: PhotoAttachment = {
        url: dataUrl,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        caption: photoCaptionInput.trim() || undefined,
        attachedAt: new Date().toISOString(),
      };
      setStagedPhoto(stagedCandidate);
    } catch (err: any) {
      setPhotoError(err?.message || 'Could not process the selected image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommitAttachPhoto = () => {
    if (!stagedPhoto) return;
    const committed: PhotoAttachment = {
      ...stagedPhoto,
      caption: photoCaptionInput.trim() || undefined,
      attachedAt: new Date().toISOString(),
    };
    setPhotoAttachment(committed);
    setStagedPhoto(null);
    setHasUnsavedChanges(true);
  };

  const handleCancelStagedPhoto = () => {
    setStagedPhoto(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhotoAttachment = () => {
    setPhotoAttachment(null);
    setPhotoCaptionInput('');
    setPhotoError(null);
    setHasUnsavedChanges(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoCaptionChange = (val: string) => {
    setPhotoCaptionInput(val);
    if (photoAttachment && !stagedPhoto) {
      setPhotoAttachment({
        ...photoAttachment,
        caption: val,
      });
      setHasUnsavedChanges(true);
    }
  };

  // File / Document Selection and Staging Handlers
  const handleDocumentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileError(null);

    const validation = isSupportedDocument(file);
    if (!validation.supported) {
      setFileError(validation.error || 'Please select a supported document (PDF, DOC, DOCX, TXT, or MD).');
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const extractedText = await extractDocumentText(file, validation.extension, dataUrl);

      const staged: FileAttachment = {
        fileName: file.name,
        fileType: validation.extension,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
        dataUrl,
        extractedText: extractedText || undefined,
        description: fileDescriptionInput.trim() || undefined,
        attachedAt: new Date().toISOString(),
      };
      setStagedFile(staged);
    } catch (err: any) {
      setFileError(err?.message || 'Could not process the selected document.');
    } finally {
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleCommitAttachFile = () => {
    if (!stagedFile) return;
    const committed: FileAttachment = {
      ...stagedFile,
      description: fileDescriptionInput.trim() || undefined,
      attachedAt: new Date().toISOString(),
    };
    setFileAttachment(committed);
    setStagedFile(null);
    setHasUnsavedChanges(true);
  };

  const handleCancelStagedFile = () => {
    setStagedFile(null);
    setFileError(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleRemoveFileAttachment = () => {
    setFileAttachment(null);
    setStagedFile(null);
    setFileDescriptionInput('');
    setFileError(null);
    setHasUnsavedChanges(true);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleSaveOnly = () => {
    const updatedEntry: JournalEntry = {
      ...entry,
      title: title.trim() || 'Untitled Reflection',
      content: content.trim(),
      mood,
      mode,
      tags,
      youtubeAttachment: youtubeAttachment || undefined,
      webLinkAttachment: webLinkAttachment || undefined,
      photoAttachment: photoAttachment || undefined,
      fileAttachment: fileAttachment || undefined,
      spotifyAttachment: spotifyAttachment || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedEntry);
    setHasUnsavedChanges(false);
  };

  const handleGenerateAndSave = (selectedMode?: ReflectionMode) => {
    const currentMode = selectedMode || mode;
    const updatedEntry: JournalEntry = {
      ...entry,
      title: title.trim() || 'Untitled Reflection',
      content: content.trim(),
      mood,
      mode: currentMode,
      tags,
      youtubeAttachment: youtubeAttachment || undefined,
      webLinkAttachment: webLinkAttachment || undefined,
      photoAttachment: photoAttachment || undefined,
      fileAttachment: fileAttachment || undefined,
      spotifyAttachment: spotifyAttachment || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedEntry);
    setHasUnsavedChanges(false);
    onGenerateAI(updatedEntry, currentMode);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl relative">
      {/* Hidden File Input for Photo Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePhotoSelected}
      />
      {/* Hidden File Input for Document Picker */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleDocumentSelected}
      />
      {/* Error Alert Banner if any */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateAndSave()}
              className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-rose-100 font-medium rounded-md text-[11px] transition-colors cursor-pointer"
            >
              Retry Save & AI
            </button>
            <button
              onClick={onClearError}
              className="text-stone-400 hover:text-stone-200 text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Photo Error Banner if any */}
      {photoError && (
        <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{photoError}</span>
          </div>
          <button
            onClick={() => setPhotoError(null)}
            className="text-stone-400 hover:text-stone-200 text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* File / Document Error Banner if any */}
      {fileError && (
        <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{fileError}</span>
          </div>
          <button
            onClick={() => setFileError(null)}
            className="text-stone-400 hover:text-stone-200 text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar: Title, Add Context & Save Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <input
          id="journal-entry-title-input"
          type="text"
          placeholder="Entry Title (e.g. Navigating team priorities & finding balance)"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-lg sm:text-xl font-bold bg-transparent text-stone-100 placeholder-stone-600 focus:outline-hidden w-full"
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Add Context Action */}
          <div className="relative" ref={contextMenuRef}>
            <button
              id="journal-add-context-btn"
              onClick={() => setIsContextMenuOpen(!isContextMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-800 bg-stone-950 text-stone-300 hover:text-amber-300 hover:border-amber-500/30 transition-all cursor-pointer"
              title="Attach external context to this reflection"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Context</span>
            </button>

            {isContextMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button
                  id="add-youtube-context-option"
                  onClick={() => {
                    setShowYoutubeInput(true);
                    setShowWebLinkInput(false);
                    setIsContextMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-2 transition-colors cursor-pointer border-b border-stone-800/60"
                >
                  <Video className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <div className="font-semibold">YouTube Video</div>
                    <div className="text-[10px] text-stone-400">Attach video context</div>
                  </div>
                </button>

                <button
                  id="add-weblink-context-option"
                  onClick={() => {
                    setShowWebLinkInput(true);
                    setShowYoutubeInput(false);
                    setIsContextMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-2 transition-colors cursor-pointer border-b border-stone-800/60"
                >
                  <LinkIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Web Link</div>
                    <div className="text-[10px] text-stone-400">Attach article or webpage</div>
                  </div>
                </button>

                <button
                  id="add-photo-context-option"
                  onClick={() => {
                    setIsContextMenuOpen(false);
                    setPhotoError(null);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-2 transition-colors cursor-pointer border-b border-stone-800/60"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Photo</div>
                    <div className="text-[10px] text-stone-400">Attach visual memory</div>
                  </div>
                </button>

                <button
                  id="add-file-context-option"
                  onClick={() => {
                    setIsContextMenuOpen(false);
                    setFileError(null);
                    docInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-2 transition-colors cursor-pointer border-b border-stone-800/60"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">File / Document</div>
                    <div className="text-[10px] text-stone-400">Attach PDF, DOC, TXT, MD</div>
                  </div>
                </button>

                <button
                  id="add-spotify-context-option"
                  onClick={() => {
                    setShowSpotifyInput(true);
                    setShowYoutubeInput(false);
                    setShowWebLinkInput(false);
                    setIsContextMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-200 hover:bg-stone-800/80 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Spotify / Music</div>
                    <div className="text-[10px] text-stone-400">Attach song or track context</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            id="journal-save-button"
            onClick={handleSaveOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-stone-800 text-amber-300 border-amber-500/40 hover:bg-stone-750'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-300'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{hasUnsavedChanges ? 'Save Draft' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* YouTube URL Input Form Drawer */}
      {showYoutubeInput && !youtubeAttachment && (
        <div className="mb-4 p-3.5 bg-stone-950/90 border border-amber-500/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Video className="w-4 h-4 text-red-400" />
              <span>Attach YouTube Video Context</span>
            </div>
            <button
              onClick={() => {
                setShowYoutubeInput(false);
                setYoutubeError(null);
              }}
              className="text-stone-400 hover:text-stone-200 text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-stone-400 mb-2.5">
            Connect a video you watched to ground your journal reflection. The journal reflection remains your primary source of truth.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="youtube-url-input"
              type="text"
              placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=... or youtu.be/...)"
              value={youtubeUrlInput}
              onChange={(e) => {
                setYoutubeUrlInput(e.target.value);
                if (youtubeError) setYoutubeError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchYoutubeMetadata();
                }
              }}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50"
            />
            <button
              id="attach-youtube-btn"
              onClick={handleFetchYoutubeMetadata}
              disabled={isLoadingYoutube || !youtubeUrlInput.trim()}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5"
            >
              {isLoadingYoutube ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Attach Video</span>
              )}
            </button>
          </div>

          {youtubeError && (
            <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{youtubeError}</span>
            </div>
          )}
        </div>
      )}

      {/* Spotify URL Input Form Drawer */}
      {showSpotifyInput && !spotifyAttachment && (
        <div className="mb-4 p-3.5 bg-stone-950/90 border border-emerald-500/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Music className="w-4 h-4 text-emerald-400" />
              <span>Attach Spotify / Music Context</span>
            </div>
            <button
              onClick={() => {
                setShowSpotifyInput(false);
                setSpotifyError(null);
              }}
              className="text-stone-400 hover:text-stone-200 text-xs p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-stone-400 mb-2.5">
            Connect a song that accompanied your thoughts or captures your mood. Your reflection remains the central focus.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="spotify-url-input"
              type="text"
              placeholder="Paste Spotify track link (e.g. https://open.spotify.com/track/...)"
              value={spotifyUrlInput}
              onChange={(e) => {
                setSpotifyUrlInput(e.target.value);
                if (spotifyError) setSpotifyError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchSpotifyMetadata();
                }
              }}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-emerald-500/50"
            />
            <button
              id="attach-spotify-btn"
              onClick={handleFetchSpotifyMetadata}
              disabled={isLoadingSpotify || !spotifyUrlInput.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5"
            >
              {isLoadingSpotify ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-stone-950" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Attach Music</span>
              )}
            </button>
          </div>

          {spotifyError && (
            <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{spotifyError}</span>
            </div>
          )}
        </div>
      )}

      {/* Web Link URL Input Form Drawer */}
      {showWebLinkInput && !webLinkAttachment && (
        <div className="mb-4 p-3.5 bg-stone-950/90 border border-cyan-500/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <LinkIcon className="w-4 h-4 text-cyan-400" />
              <span>Attach Web Link Context</span>
            </div>
            <button
              onClick={() => {
                setShowWebLinkInput(false);
                setWebLinkError(null);
              }}
              className="text-stone-400 hover:text-stone-200 text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-stone-400 mb-2.5">
            Attach an article, documentation page, or tutorial you read to enrich your personal reflection. Your reflections remain the central focus.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="weblink-url-input"
              type="text"
              placeholder="Paste URL (e.g. https://developer.mozilla.org/... or https://example.com/article)"
              value={webUrlInput}
              onChange={(e) => {
                setWebUrlInput(e.target.value);
                if (webLinkError) setWebLinkError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchWebLinkMetadata();
                }
              }}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-cyan-500/50"
            />
            <button
              id="attach-weblink-btn"
              onClick={handleFetchWebLinkMetadata}
              disabled={isLoadingWebLink || !webUrlInput.trim()}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5"
            >
              {isLoadingWebLink ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Attach Link</span>
              )}
            </button>
          </div>

          {webLinkError && (
            <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{webLinkError}</span>
            </div>
          )}
        </div>
      )}

      {/* Photo Staging & Preview Drawer (Before Attachment Confirmation) */}
      {stagedPhoto && (
        <div 
          id="photo-staging-drawer"
          className="mb-4 p-3.5 bg-stone-950/90 border border-amber-500/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Attach Photo Context</span>
            </div>
            <button
              id="cancel-staged-photo-x-btn"
              type="button"
              onClick={handleCancelStagedPhoto}
              className="text-stone-400 hover:text-stone-200 text-xs p-1 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-stone-400 mb-2.5">
            Preview your visual memory and add an optional caption before attaching it to this reflection.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="relative rounded-lg overflow-hidden bg-stone-900 border border-stone-800 shrink-0 max-w-xs w-full sm:w-48">
              <img
                src={stagedPhoto.url}
                alt={stagedPhoto.caption || stagedPhoto.fileName || 'Selected photo preview'}
                referrerPolicy="no-referrer"
                className="w-full h-32 object-cover"
              />
            </div>

            <div className="flex-1 w-full space-y-2">
              <div>
                <label htmlFor="staged-photo-caption-input" className="text-[11px] font-medium text-stone-400 block mb-1">
                  Optional caption:
                </label>
                <input
                  id="staged-photo-caption-input"
                  type="text"
                  placeholder="What does this moment mean? (e.g. Finally finished the project)"
                  value={photoCaptionInput}
                  onChange={(e) => setPhotoCaptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitAttachPhoto();
                    }
                  }}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="text-[10px] text-stone-500 truncate">
                  {stagedPhoto.fileName} ({Math.round(stagedPhoto.sizeBytes / 1024)} KB)
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    id="cancel-staged-photo-btn"
                    onClick={handleCancelStagedPhoto}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 text-xs font-medium rounded-lg border border-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    id="attach-photo-btn"
                    onClick={handleCommitAttachPhoto}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staged File / Document Attachment Drawer */}
      {stagedFile && (
        <div id="staged-file-panel" className="mb-4 p-3.5 bg-stone-950/90 border border-emerald-500/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Attach File / Document</span>
            </div>
            <button
              onClick={handleCancelStagedFile}
              className="text-stone-400 hover:text-stone-200 text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center shrink-0">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="flex-1 w-full space-y-2">
              <div>
                <label htmlFor="staged-file-desc-input" className="text-[11px] font-medium text-stone-400 block mb-1">
                  Optional note / description:
                </label>
                <input
                  id="staged-file-desc-input"
                  type="text"
                  placeholder="What is this document about? (e.g. Project briefing notes)"
                  value={fileDescriptionInput}
                  onChange={(e) => setFileDescriptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitAttachFile();
                    }
                  }}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="text-[10px] text-stone-400 truncate">
                  <span className="font-mono uppercase text-emerald-400 font-semibold">{stagedFile.fileType}</span> • {stagedFile.fileName} ({formatFileSize(stagedFile.sizeBytes)})
                  {stagedFile.extractedText ? (
                    <span className="ml-1.5 text-emerald-400/90 font-medium">✓ Text extracted</span>
                  ) : (
                    <span className="ml-1.5 text-stone-500">• Metadata attached</span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    id="cancel-staged-file-btn"
                    onClick={handleCancelStagedFile}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 text-xs font-medium rounded-lg border border-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    id="attach-file-btn"
                    onClick={handleCommitAttachFile}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Attached Contexts Grid Section */}
      <AttachedContextsGrid
        youtubeAttachment={youtubeAttachment}
        webLinkAttachment={webLinkAttachment}
        photoAttachment={stagedPhoto ? null : photoAttachment}
        fileAttachment={stagedFile ? null : fileAttachment}
        spotifyAttachment={spotifyAttachment}
        onRemoveYoutube={handleRemoveYoutubeAttachment}
        onRemoveWebLink={handleRemoveWebLinkAttachment}
        onRemovePhoto={handleRemovePhotoAttachment}
        onRemoveFile={handleRemoveFileAttachment}
        onRemoveSpotify={handleRemoveSpotifyAttachment}
        onReplacePhoto={() => {
          setPhotoError(null);
          fileInputRef.current?.click();
        }}
        onUpdatePhotoCaption={handlePhotoCaptionChange}
      />

      {/* Mood Selector Chips */}
      <div className="mb-4">
        <div className="text-[11px] font-medium text-stone-400 mb-1.5 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-stone-400" />
          <span>Current Mood / Emotional State:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = mood === opt.value;
            return (
              <button
                key={opt.value}
                id={`mood-select-${opt.value}`}
                onClick={() => {
                  setMood(opt.value);
                  setHasUnsavedChanges(true);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer font-medium ${
                  isSelected
                    ? opt.color + ' ring-1 ring-amber-500/30'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Starters */}
      {!content && (
        <div className="mb-3 p-2.5 bg-stone-950/70 border border-stone-800/80 rounded-xl">
          <div className="text-[11px] font-medium text-amber-400/90 mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Need inspiration? Click a prompt starter:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_STARTERS.map((starter, i) => (
              <button
                key={i}
                onClick={() => handleContentChange(starter + '\n\n')}
                className="text-[11px] text-stone-400 bg-stone-900 hover:bg-stone-850 hover:text-stone-200 border border-stone-800 px-2 py-1 rounded-md transition-colors text-left cursor-pointer"
              >
                "{starter}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Journal Textarea */}
      <div className="relative mb-4">
        <textarea
          id="journal-entry-content-textarea"
          rows={7}
          placeholder="Pour your raw thoughts, journal reflections, or decisions here... Be honest and unrestrained."
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-stone-200 text-sm placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50 leading-relaxed font-sans resize-y min-h-[160px]"
        />
        <div className="absolute bottom-2.5 right-3 text-[10px] text-stone-500 pointer-events-none">
          {wordCount} words
        </div>
      </div>

      {/* Tags Row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-800 border border-stone-700 text-stone-300 text-xs rounded-md"
          >
            #{tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-stone-500 hover:text-stone-300 text-[10px] cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="bg-stone-950 border border-stone-800 rounded-md px-2 py-0.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-hidden w-24"
          />
          {newTag && (
            <button
              onClick={handleAddTag}
              className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* AI Mode Selector & Action Bar */}
      <div className="pt-4 border-t border-stone-800">
        <div className="text-[11px] font-medium text-stone-400 mb-2 flex items-center justify-between">
          <span>Choose AI Reflection Mode:</span>
          <span className="text-[10px] text-amber-400/80">Gemini 3.6 Flash</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          {REFLECTION_MODES.map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                id={`reflection-mode-tab-${m.id}`}
                onClick={() => {
                  setMode(m.id);
                  setHasUnsavedChanges(true);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 text-stone-100 ring-1 ring-amber-500/20'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <span>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-1 line-clamp-2">
                  {m.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Generate / Reflect Button */}
        <button
          id="generate-gemini-reflection-btn"
          onClick={() => handleGenerateAndSave()}
          disabled={isGeneratingAI || !content.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isGeneratingAI ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-stone-950" />
              <span>Gemini is reflecting on your entry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Generate Gemini Reflection & Save to Firestore</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

