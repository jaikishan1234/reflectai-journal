import { JournalEntry, UserProfile } from '../types';
import { db, doc, setDoc, getDocs, deleteDoc, collection, query, orderBy } from '../lib/firebase';

const AUTH_USER_KEY = 'reflectai_auth_user';
const STORAGE_PREFIX = 'reflectai_entries_';

// Strict Undefined-Stripping & Zero-Crash Payload Sanitizer
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) {
      return null;
    }
    return value;
  }));
}

export const StorageService = {
  // Authentication State Cache
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sanitizePayload(user)));
    }
  },

  // User-Isolated Document Storage (Local Cache Read)
  getLocalEntries(userId: string): JournalEntry[] {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (!raw) return [];
      const parsed: JournalEntry[] = JSON.parse(raw);
      return parsed.filter(entry => entry.userId === userId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error('Failed to load local entries:', err);
      return [];
    }
  },

  saveLocalEntries(userId: string, entries: JournalEntry[]): void {
    if (!userId) return;
    const sanitized = sanitizePayload(entries.filter(e => e.userId === userId));
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(sanitized));
  },

  // Firestore Sync: Fetch All Entries from `/users/{userId}/interactions`
  async fetchFirestoreEntries(userId: string): Promise<JournalEntry[]> {
    if (!userId) return [];
    try {
      const colRef = collection(db, 'users', userId, 'interactions');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const firestoreEntries: JournalEntry[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as JournalEntry;
        if (data && data.userId === userId) {
          firestoreEntries.push({
            ...data,
            id: docSnap.id || data.id,
          });
        }
      });

      if (firestoreEntries.length > 0) {
        this.saveLocalEntries(userId, firestoreEntries);
        return firestoreEntries;
      }
    } catch (err) {
      console.warn('[Firestore] Could not load entries from cloud (using local cache):', err);
    }
    return this.getLocalEntries(userId);
  },

  // Save Entry to both Cloud Firestore and Local Mirror
  async saveEntry(userId: string, entry: JournalEntry): Promise<JournalEntry> {
    if (!userId) throw new Error('Cannot save entry without active user ID');
    
    const localEntries = this.getLocalEntries(userId);
    const existingIndex = localEntries.findIndex(e => e.id === entry.id);
    
    const preparedEntry: JournalEntry = {
      ...entry,
      userId,
      updatedAt: new Date().toISOString(),
      messages: entry.messages || [],
      tags: entry.tags || [],
    };

    const sanitized = sanitizePayload(preparedEntry);

    // Update Local Cache immediately for fast UI feedback
    if (existingIndex >= 0) {
      localEntries[existingIndex] = sanitized;
    } else {
      localEntries.unshift(sanitized);
    }
    this.saveLocalEntries(userId, localEntries);

    // Persist to Cloud Firestore: `/users/{userId}/interactions/{entryId}`
    try {
      const docRef = doc(db, 'users', userId, 'interactions', preparedEntry.id);
      await setDoc(docRef, sanitized, { merge: true });
      console.log(`[Firestore] Entry ${preparedEntry.id} saved to /users/${userId}/interactions`);
    } catch (err) {
      console.warn('[Firestore] Remote save notice (local copy preserved):', err);
    }

    return sanitized;
  },

  // Delete Entry from both Cloud Firestore and Local Mirror
  async deleteEntry(userId: string, entryId: string): Promise<void> {
    if (!userId || !entryId) return;
    
    const localEntries = this.getLocalEntries(userId);
    const updated = localEntries.filter(e => e.id !== entryId);
    this.saveLocalEntries(userId, updated);

    try {
      const docRef = doc(db, 'users', userId, 'interactions', entryId);
      await deleteDoc(docRef);
      console.log(`[Firestore] Entry ${entryId} deleted from cloud.`);
    } catch (err) {
      console.warn('[Firestore] Remote delete notice:', err);
    }
  },

  // Initial Seed for new users: provides 3 realistic, grounded entries covering learning, focus, and milestones
  async seedInitialData(userId: string, userName: string): Promise<JournalEntry[]> {
    const existing = await this.fetchFirestoreEntries(userId);
    if (existing.length > 0) return existing;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const sampleEntries: JournalEntry[] = [
      {
        id: 'reflection-study-focus',
        userId,
        title: 'Deep Study Session & Focus Calibration 📚',
        content: `Spent 3 hours this morning studying distributed systems and cloud database architectures. I used the Pomodoro technique (25 min focus, 5 min break) which drastically reduced digital distractions. Taking handwritten notes helped me retain complex consistency models much better than passively watching lectures. I noticed my energy dips around the 2-hour mark, so taking a short walking break was essential for staying sharp.`,
        mood: 'motivated',
        tags: ['Studying', 'Deep Work', 'Learning', 'Productivity'],
        mode: 'action_plan',
        aiResponse: `### Deep Work Analysis & Focus Strategy, ${userName}!

Your structured approach to studying using time-boxing and active note-taking demonstrates excellent discipline.

**Key Observations:**
- Utilizing active retention techniques (handwritten notes) enhances comprehension of intricate topics.
- Recognizing the 2-hour cognitive fatigue threshold allows for proactive scheduling of restorative breaks.

**Suggested Next Steps:**
1. Maintain the 25/5 Pomodoro rhythm for tomorrow's revision block.
2. Schedule a 15-minute active recall review session before beginning new material.`,
        aiKeyInsights: [
          'Handwritten synthesis significantly improves conceptual retention.',
          'Cognitive stamina peaks in early morning study windows.'
        ],
        aiActionItems: [
          'Prepare active recall flashcards for distributed systems terms.',
          'Keep phone in another room during the first 2-hour focus block.'
        ],
        messages: [
          {
            id: 'msg-study-1',
            role: 'user',
            content: 'How can I prevent the mid-study afternoon slump?',
            timestamp: new Date(now - 2 * dayMs + 1800000).toISOString(),
          },
          {
            id: 'msg-study-2',
            role: 'assistant',
            content: 'Hydrate before you feel thirsty, take a brisk 5-minute outdoor walk without screens, and switch from passive reading to active problem-solving exercises during lower-energy windows.',
            timestamp: new Date(now - 2 * dayMs + 2100000).toISOString(),
          }
        ],
        createdAt: new Date(now - 2 * dayMs).toISOString(),
        updatedAt: new Date(now - 2 * dayMs).toISOString(),
      },
      {
        id: 'reflection-distraction-routine',
        userId,
        title: 'Overcoming Study Distractions & Task Switching ⚡',
        content: `Reflecting on my afternoon study habits: I caught myself repeatedly switching between coding exercises, checking email, and browsing documentation tabs. Multi-tasking made studying feel fragmented and increased my cognitive fatigue. Once I closed unnecessary browser tabs and put on ambient focus audio, I regained flow and finished my algorithm practice set. The main takeaway is that context switching is my biggest obstacle during self-directed study sessions.`,
        mood: 'thoughtful',
        tags: ['Studying', 'Focus', 'Habits', 'Mindfulness'],
        mode: 'summarize',
        aiResponse: `### Focus Calibration & Friction Reduction, ${userName}!

Acknowledging when task-switching derails study momentum is the critical first step in building sustainable focus habits.

**Key Observations:**
- Multi-tab browsing and passive notifications create high context-switching friction.
- Environmental controls (ambient focus sound, closed tabs) quickly restore cognitive flow.

**Suggested Next Steps:**
1. Implement a single-tab rule during deep practice sessions.
2. Keep a distraction capture pad on your desk to write down unrelated thoughts without acting on them immediately.`,
        aiKeyInsights: [
          'Context switching is the primary driver of afternoon study fatigue.',
          'Audio cues and minimalist browser workspaces help protect focus.'
        ],
        aiActionItems: [
          'Use a single-tab workspace during algorithm practice.',
          'Log distracting impulses on a notepad rather than opening new tabs.'
        ],
        messages: [],
        createdAt: new Date(now - dayMs).toISOString(),
        updatedAt: new Date(now - dayMs).toISOString(),
      },
      {
        id: 'welcome-reflection-1',
        userId,
        title: 'Welcome to ReflectAI & Learning Milestones ✨',
        content: `Today I started using ReflectAI to build a regular journaling and mindful reflection habit. I want to balance my daily productivity and intensive study routines with mental clarity, reduce burnout, and get actionable suggestions from Gemini. My main goal this month is to establish consistent daily study blocks and track how my focus evolves over time.`,
        mood: 'motivated',
        tags: ['Growth', 'Mindfulness', 'Studying', 'First Entry'],
        mode: 'reflect',
        aiResponse: `### Welcome to your reflection space, ${userName}!

Writing down your intentions is an impactful first step. Your desire to balance productivity with mental wellbeing reflects strong self-awareness.

**Key Observations:**
- You recognize that sustainable productivity requires intentional mental clarity.
- Setting up a structured reflection habit will help you process study stress proactively.

**Suggested Next Steps:**
1. Pick a consistent 5-minute window each day (e.g. morning coffee or evening wind-down) for your reflections.
2. Experiment with different AI modes like *Brainstorm* or *Action Plan* when facing complex decisions.`,
        aiKeyInsights: [
          'Recognized that high output requires deliberate cognitive recovery.',
          'Committed to regular mindful reflection.'
        ],
        aiActionItems: [
          'Set a daily 5-minute reminder for reflection.',
          'Try the Brainstorm mode on an upcoming creative challenge.'
        ],
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'How can I stay consistent with journaling without feeling overwhelmed?',
            timestamp: new Date(now - 3600000).toISOString(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Keep the barrier to entry extremely low! Even 2-3 bullet points about what went well and what you felt today is enough. Consistency beats length every single time.',
            timestamp: new Date(now - 3500000).toISOString(),
          }
        ],
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      }
    ];

    for (const entry of sampleEntries) {
      await this.saveEntry(userId, entry);
    }
    return sampleEntries;
  }
};
