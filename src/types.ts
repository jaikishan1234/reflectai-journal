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
  createdAt: string;
  updatedAt: string;
}

export interface GenerateReflectionRequest {
  prompt: string;
  entryTitle?: string;
  mode: ReflectionMode;
  mood?: string;
  tags?: string[];
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



