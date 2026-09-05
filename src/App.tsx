import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, JournalEntry, ReflectionMode, ChatMessage, ActiveViewType } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { AuthModal } from './components/AuthModal';
import { JournalEditor } from './components/JournalEditor';
import { ReflectionCard } from './components/ReflectionCard';
import { ConversationThread } from './components/ConversationThread';
import { HistorySidebar } from './components/HistorySidebar';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { PersonalInsightsView } from './components/PersonalInsightsView';
import { AskJournalView } from './components/AskJournalView';
import { YourStoryView } from './components/YourStoryView';
import { WellbeingView } from './components/WellbeingView';
import { WrappedView } from './components/WrappedView';
import { JournalIntelligenceView } from './components/JournalIntelligenceView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => StorageService.getCurrentUser());
  const [activeView, setActiveView] = useState<ActiveViewType>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load User Entries with Cloud Firestore synchronization
  useEffect(() => {
    let isMounted = true;
    if (currentUser) {
      // First load instant local cache
      const cached = StorageService.getLocalEntries(currentUser.uid);
      if (cached.length > 0) {
        setEntries(cached);
        setActiveEntry(prev => (prev && prev.userId === currentUser.uid ? prev : cached[0]));
      } else if (StorageService.isUserInitialized(currentUser.uid)) {
        setEntries([]);
        setActiveEntry(null);
      }

      // Then fetch remote Firestore documents
      StorageService.fetchFirestoreEntries(currentUser.uid).then(cloudEntries => {
        if (!isMounted) return;
        if (cloudEntries.length === 0 && !StorageService.isUserInitialized(currentUser.uid)) {
          StorageService.seedInitialData(currentUser.uid, currentUser.displayName).then(seeded => {
            if (!isMounted) return;
            setEntries(seeded);
            setActiveEntry(seeded[0] || null);
          });
        } else {
          setEntries(cloudEntries);
          setActiveEntry(prev => {
            if (prev && cloudEntries.some(e => e.id === prev.id)) {
              return cloudEntries.find(e => e.id === prev.id) || cloudEntries[0];
            }
            return cloudEntries[0] || null;
          });
        }
      });
    } else {
      setEntries([]);
      setActiveEntry(null);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Calculate Streak
  const streakCount = useMemo(() => {
    if (!entries || entries.length === 0) return 0;

    const toDateKey = (dateInput: string | number | Date) => {
      const d = new Date(dateInput);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const dates = new Set(entries.map(e => toDateKey(e.createdAt)));
    
    let count = 0;
    const today = new Date();
    const todayStr = toDateKey(today);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = toDateKey(yesterday);

    // If no reflection recorded today and none yesterday, the streak is broken
    if (!dates.has(todayStr) && !dates.has(yesterdayStr)) {
      return 0;
    }

    // Start backwards count from today (if written today) or yesterday (if written yesterday)
    const startDate = dates.has(todayStr) ? today : yesterday;
    const checkDate = new Date(startDate);

    while (dates.has(toDateKey(checkDate))) {
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return count;
  }, [entries]);

  const handleAuthenticate = (user: UserProfile) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveEntry(null);
    setEntries([]);
  };

  const handleCreateNewEntry = () => {
    if (!currentUser) return;
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: currentUser.uid,
      title: '',
      content: '',
      mood: 'thoughtful',
      tags: [],
      mode: 'reflect',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveEntry(newEntry);
  };

  const handleStartDailyPrompt = (promptText: string, title?: string) => {
    if (!currentUser) return;
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: currentUser.uid,
      title: title || 'Daily Wellbeing Reflection',
      content: `> **Reflection Prompt:** ${promptText}\n\n`,
      mood: 'thoughtful',
      tags: ['#wellbeing', '#dailyreflection'],
      mode: 'wellness',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveEntry(newEntry);
    setActiveView('journal');
  };

  const handleSaveEntry = async (entryToSave: JournalEntry) => {
    if (!currentUser) return;
    try {
      const saved = await StorageService.saveEntry(currentUser.uid, entryToSave);
      setActiveEntry(saved);
      const updatedList = StorageService.getLocalEntries(currentUser.uid);
      setEntries(updatedList);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to save entry:', err);
      setErrorMessage('Failed to save entry to database. Your draft is retained.');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    await StorageService.deleteEntry(currentUser.uid, entryId);
    const updated = StorageService.getLocalEntries(currentUser.uid);
    setEntries(updated);
    if (activeEntry?.id === entryId) {
      setActiveEntry(updated.length > 0 ? updated[0] : null);
    }
  };

  // Generate Gemini AI Reflection
  const handleGenerateAI = async (entry: JournalEntry, mode: ReflectionMode) => {
    if (!currentUser) return;
    setIsGeneratingAI(true);
    setErrorMessage(null);

    try {
      const payload = {
        prompt: entry.content,
        entryTitle: entry.title || 'Personal Reflection',
        mode: mode,
        mood: entry.mood,
        tags: entry.tags,
        youtubeAttachment: entry.youtubeAttachment || null,
        webLinkAttachment: entry.webLinkAttachment || null,
        photoAttachment: entry.photoAttachment || null,
        fileAttachment: entry.fileAttachment || null,
        spotifyAttachment: entry.spotifyAttachment || null,
      };

      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      
      const updatedEntry: JournalEntry = {
        ...entry,
        mode: mode,
        aiResponse: data.reply || '',
        aiKeyInsights: data.insights || [],
        aiActionItems: data.actionItems || [],
        updatedAt: new Date().toISOString(),
      };

      // Guaranteed transaction verification: persist immediately
      await handleSaveEntry(updatedEntry);
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setErrorMessage('Gemini reflection encountered a temporary delay. Click "Retry Save & AI" to try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Multi-Turn Chat with Gemini
  const handleSendChatMessage = async (userMessage: string) => {
    if (!currentUser || !activeEntry) return;
    setIsChatGenerating(true);

    const userChatMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_user',
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = activeEntry.messages || [];
    const updatedMessages = [...currentMessages, userChatMsg];

    const tempEntry: JournalEntry = {
      ...activeEntry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Save user's question first
    await handleSaveEntry(tempEntry);

    try {
      // Build conversation history format
      const historyPayload = [
        { role: 'user', content: `Journal Entry Content:\n${activeEntry.content}` },
        ...(activeEntry.aiResponse ? [{ role: 'assistant', content: activeEntry.aiResponse }] : []),
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          entryTitle: activeEntry.title || 'Follow-up Dialogue',
          mode: activeEntry.mode || 'reflect',
          mood: activeEntry.mood,
          history: historyPayload,
          youtubeAttachment: activeEntry.youtubeAttachment || null,
          webLinkAttachment: activeEntry.webLinkAttachment || null,
          photoAttachment: activeEntry.photoAttachment || null,
          fileAttachment: activeEntry.fileAttachment || null,
          spotifyAttachment: activeEntry.spotifyAttachment || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with code ${response.status}`);
      }

      const data = await response.json();

      const aiChatMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_ai',
        role: 'assistant',
        content: data.reply || 'I reflected on your thought and appreciate your willingness to look deeper.',
        timestamp: new Date().toISOString(),
      };

      const finalEntry: JournalEntry = {
        ...tempEntry,
        messages: [...updatedMessages, aiChatMsg],
        updatedAt: new Date().toISOString(),
      };

      await handleSaveEntry(finalEntry);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackAiMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_fallback',
        role: 'assistant',
        content: 'I noticed your question. Focus on the core reason behind this reflection today, and remember that small consistent steps lead to clarity.',
        timestamp: new Date().toISOString(),
      };
      const finalEntry: JournalEntry = {
        ...tempEntry,
        messages: [...updatedMessages, fallbackAiMsg],
        updatedAt: new Date().toISOString(),
      };
      await handleSaveEntry(finalEntry);
    } finally {
      setIsChatGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-[#3282B8]/30 selection:text-stone-100">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onNewEntry={() => {
          handleCreateNewEntry();
          setActiveView('journal');
        }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        streakCount={streakCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {!currentUser ? (
          <LandingHero onSignIn={() => setIsAuthModalOpen(true)} />
        ) : activeView === 'intelligence' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
            <JournalIntelligenceView
              entries={entries}
              user={currentUser}
              onNewEntry={() => {
                handleCreateNewEntry();
                setActiveView('journal');
              }}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveView('journal');
              }}
            />
          </div>
        ) : activeView === 'insights' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
            <PersonalInsightsView
              entries={entries}
              user={currentUser}
              onNewEntry={() => {
                handleCreateNewEntry();
                setActiveView('journal');
              }}
            />
          </div>
        ) : activeView === 'ask_journal' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
            <AskJournalView
              entries={entries}
              user={currentUser}
              onNewEntry={() => {
                handleCreateNewEntry();
                setActiveView('journal');
              }}
            />
          </div>
        ) : activeView === 'story' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
            <YourStoryView
              entries={entries}
              user={currentUser}
              onNewEntry={() => {
                handleCreateNewEntry();
                setActiveView('journal');
              }}
            />
          </div>
        ) : activeView === 'wellbeing' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
            <WellbeingView
              entries={entries}
              user={currentUser}
              onNewEntry={() => {
                handleCreateNewEntry();
                setActiveView('journal');
              }}
              onStartDailyPrompt={handleStartDailyPrompt}
            />
          </div>
        ) : activeView === 'wrapped' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
            <WrappedView
              entries={entries}
              user={currentUser}
              onBackToJournal={() => setActiveView('journal')}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
            {/* History Sidebar */}
            <HistorySidebar
              entries={entries}
              selectedEntryId={activeEntry?.id || null}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveView('journal');
              }}
              onNewEntry={handleCreateNewEntry}
              onDeleteEntry={handleDeleteEntry}
              userName={currentUser.displayName}
            />

            {/* Active Workspace */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {activeEntry ? (
                <>
                  <JournalEditor
                    entry={activeEntry}
                    onSave={handleSaveEntry}
                    onGenerateAI={handleGenerateAI}
                    isGeneratingAI={isGeneratingAI}
                    errorMessage={errorMessage}
                    onClearError={() => setErrorMessage(null)}
                  />

                  {/* AI Response Card */}
                  {activeEntry.aiResponse && (
                    <ReflectionCard
                      entry={activeEntry}
                      onAskFollowUp={handleSendChatMessage}
                    />
                  )}

                  {/* Multi-turn Conversation Thread */}
                  {activeEntry.aiResponse && (
                    <ConversationThread
                      messages={activeEntry.messages || []}
                      onSendMessage={handleSendChatMessage}
                      isGenerating={isChatGenerating}
                    />
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-stone-900/60 border border-stone-800 rounded-2xl text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    ✍️
                  </div>
                  <h3 className="text-base font-bold text-stone-200">No Entry Selected</h3>
                  <p className="text-xs text-stone-400 max-w-sm mt-1 mb-4">
                    Select a previous reflection from the sidebar or click below to start a new entry.
                  </p>
                  <button
                    onClick={handleCreateNewEntry}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Create New Reflection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        entries={entries}
        streakCount={streakCount}
      />

      {/* Security Architecture Modal */}
      <SecurityGuideModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />
    </div>
  );
}
