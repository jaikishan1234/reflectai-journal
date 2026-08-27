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

export interface GenerateReflectionResponse {
  reply: string;
  insights: string[];
  actionItems: string[];
  modelUsed: string;
}
