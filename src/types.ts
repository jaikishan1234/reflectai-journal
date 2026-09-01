export type ActiveViewType = 'journal' | 'insights' | 'ask_journal' | 'story' | 'wellbeing' | 'wrapped';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'wellness' | 'action_plan';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface YouTubeAttachment {
  videoId: string;
  url: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  authorUrl?: string;
  timestampNote?: string;
  attachedAt?: string;
}

export interface WebLinkAttachment {
  url: string;
  title: string;
  description?: string;
  domain: string;
  imageUrl?: string;
  extractedSnippet?: string;
  attachedAt?: string;
}

export interface PhotoAttachment {
  url: string;
  caption?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  attachedAt?: string;
}

export interface FileAttachment {
  fileName: string;
  fileType: string;
  mimeType?: string;
  sizeBytes: number;
  description?: string;
  dataUrl?: string;
  extractedText?: string;
  attachedAt?: string;
}

export interface SpotifyAttachment {
  url: string;
  trackId?: string;
  trackName: string;
  artistName?: string;
  albumName?: string;
  thumbnailUrl?: string;
  durationMs?: number;
  durationFormatted?: string;
  releaseDate?: string;
  isExplicit?: boolean;
  previewUrl?: string;
  attachedAt?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: 'peaceful' | 'energized' | 'thoughtful' | 'anxious' | 'motivated' | 'overwhelmed';
  tags: string[];
  mode: ReflectionMode;
  aiResponse?: string;
  aiKeyInsights?: string[];
  aiActionItems?: string[];
  messages: ChatMessage[];
  photos?: string[];
  photoAttachment?: PhotoAttachment | null;
  fileAttachment?: FileAttachment | null;
  spotifyAttachment?: SpotifyAttachment | null;
  location?: string;
  youtubeAttachment?: YouTubeAttachment | null;
  webLinkAttachment?: WebLinkAttachment | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateReflectionRequest {
  prompt: string;
  entryTitle?: string;
  mode: ReflectionMode;
  mood?: string;
  tags?: string[];
  youtubeAttachment?: YouTubeAttachment | null;
  webLinkAttachment?: WebLinkAttachment | null;
  photoAttachment?: PhotoAttachment | null;
  fileAttachment?: FileAttachment | null;
  spotifyAttachment?: SpotifyAttachment | null;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ThemeInsight {
  theme: string;
  explanation: string;
}

export interface ChallengeInsight {
  challenge: string;
  context: string;
}

export interface PositivePatternInsight {
  pattern: string;
  evidence: string;
}

export interface PersonalInsightsData {
  generatedAt: string;
  entryCountAnalyzed: number;
  aiSummary: {
    observations: string[];
    synthesis: string;
  };
  recurringThemes: ThemeInsight[];
  moodAnalysis: {
    dominantMood: string;
    trendDescription: string;
    moodBreakdown: Record<string, number>;
    timeline: Array<{
      id: string;
      date: string;
      mood: string;
      title: string;
    }>;
  };
  commonChallenges: ChallengeInsight[];
  positivePatterns: PositivePatternInsight[];
  suggestedNextActions: string[];
  modelUsed: string;
}

export interface JournalEvidence {
  date: string;
  entryTitle: string;
  relevance: string;
}

export interface AskJournalResponse {
  answer: string;
  hasSufficientContext: boolean;
  evidence: JournalEvidence[];
  keyPatterns: string[];
  suggestions: string[];
  modelUsed?: string;
  questionAsked?: string;
  timestamp?: string;
}

export interface AskJournalHistoryItem {
  id: string;
  question: string;
  response: AskJournalResponse;
  timestamp: string;
}

export interface StoryEvidence {
  entryId: string;
  entryTitle: string;
  date: string;
  excerpt: string;
}

export interface StoryChangeItem {
  title: string;
  description: string;
  earlierEvidence: StoryEvidence[];
  recentEvidence: StoryEvidence[];
}

export interface YourStoryResponse {
  summary: string;
  changes: StoryChangeItem[];
  hasSufficientContext: boolean;
  analyzedEntryCount: number;
  timestamp: string;
  modelUsed: string;
}

export interface WellbeingSignalQuote {
  entryId: string;
  entryTitle: string;
  date: string;
  excerpt: string;
}

export interface WellbeingSignal {
  type: 'stress' | 'workload' | 'exhaustion' | 'motivation' | 'focus' | 'routine' | 'recovery' | 'overwhelm';
  label: string;
  trend: 'improving' | 'stable' | 'increasing';
  evidenceCount: number;
  description: string;
  quotes: WellbeingSignalQuote[];
}

export interface WellbeingActionSuggestion {
  id: string;
  title: string;
  suggestion: string;
  category: 'rest' | 'focus' | 'routine' | 'reflection';
}

export interface WellbeingDailyPrompt {
  id: string;
  question: string;
  context: string;
}

export interface WellbeingAnalysisResponse {
  overallStatus: 'improving' | 'stable' | 'needs_attention';
  statusExplanation: string;
  signals: WellbeingSignal[];
  trendComparison: {
    earlierPeriod: {
      dateRange: string;
      signalIntensity: string;
      summary: string;
    };
    recentPeriod: {
      dateRange: string;
      signalIntensity: string;
      summary: string;
    };
    trajectory: 'improving' | 'stable' | 'increasing';
    trajectoryExplanation: string;
  };
  aiReflection: {
    observations: string[];
    patternsNoticed: string[];
    gentleSuggestions: string[];
    encouragement: string;
  };
  actionableSuggestions: WellbeingActionSuggestion[];
  dailyPrompt: WellbeingDailyPrompt;
  hasSufficientContext: boolean;
  analyzedEntryCount: number;
  timestamp: string;
  modelUsed: string;
}

export interface WrappedPeriodStats {
  periodTitle: string;
  dateRangeFormatted: string;
  totalEntries: number;
  activeDaysCount: number;
  currentStreak: number;
  longestStreak: number;
  totalWordsLogged: number;
  isInitialJourney: boolean;
}

export interface WrappedThemeItem {
  name: string;
  count: number;
  description: string;
  sampleExcerpt?: string;
}

export interface WrappedMoodJourney {
  dominantMood: string;
  earlierMood: string;
  recentMood: string;
  progressionDescription: string;
  moodCounts: Record<string, number>;
  totalLoggedMoods: number;
}

export interface WrappedShift {
  headline: string;
  explanation: string;
  earlierExcerpt: {
    title: string;
    date: string;
    text: string;
  };
  recentExcerpt: {
    title: string;
    date: string;
    text: string;
  };
}

export interface WrappedMomentItem {
  id: string;
  title: string;
  date: string;
  mood: string;
  tags: string[];
  excerpt: string;
}

export interface WrappedMemoryPhoto {
  entryId: string;
  entryTitle: string;
  date: string;
  photoUrl: string;
  caption?: string;
}

export interface WrappedPlaceItem {
  name: string;
  entryTitle: string;
  date: string;
  mentionCount: number;
}

export interface WrappedDataResponse {
  stats: WrappedPeriodStats;
  themes: WrappedThemeItem[];
  emotionalJourney: WrappedMoodJourney;
  biggestShift: WrappedShift;
  moments: WrappedMomentItem[];
  photos: WrappedMemoryPhoto[];
  places: WrappedPlaceItem[];
  finalReflection: {
    headline: string;
    narrative: string;
    celebrationQuote: string;
  };
  generatedAt: string;
  modelUsed: string;
  hasSufficientContext: boolean;
}




