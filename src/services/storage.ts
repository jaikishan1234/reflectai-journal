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

  // Initial Seed for new users
  async seedInitialData(userId: string, userName: string): Promise<JournalEntry[]> {
    const existing = await this.fetchFirestoreEntries(userId);
    if (existing.length > 0) return existing;

    const sampleEntry: JournalEntry = {
      id: 'welcome-reflection-1',
      userId,
      title: 'Welcome to ReflectAI ✨',
      content: `Today I started using ReflectAI to build a regular journaling and mindful reflection habit. I want to balance my daily productivity with mental clarity, reduce burnout, and get actionable suggestions from Gemini.`,
      mood: 'motivated',
      tags: ['Growth', 'Mindfulness', 'First Entry'],
      mode: 'reflect',
      aiResponse: `### Welcome to your reflection space, ${userName}!

Writing down your intentions is an impactful first step. Your desire to balance productivity with mental wellbeing reflects strong self-awareness.

**Key Observations:**
- You recognize that sustainable productivity requires intentional mental clarity.
- Setting up a structured reflection habit will help you process stress proactively.

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
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Keep the barrier to entry extremely low! Even 2-3 bullet points about what went well and what you felt today is enough. Consistency beats length every single time.',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveEntry(userId, sampleEntry);
    return [sampleEntry];
  }
};
