import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  HelpCircle, 
  BookOpen, 
  ArrowRight, 
  Calendar, 
  Lightbulb, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { JournalEntry, UserProfile, AskJournalResponse, AskJournalHistoryItem } from '../types';

interface AskJournalViewProps {
  entries: JournalEntry[];
  user: UserProfile;
  onNewEntry: () => void;
}

const EXAMPLE_QUESTIONS = [
  "What have I been struggling with recently?",
  "What patterns do you see in my studying?",
  "What positive changes have I made?",
  "What topics keep appearing in my journal?",
  "What did I write about being distracted?",
  "What have I accomplished recently?"
];

export const AskJournalView: React.FC<AskJournalViewProps> = ({
  entries,
  user,
  onNewEntry,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AskJournalHistoryItem[]>([]);
  const [activeResponse, setActiveResponse] = useState<AskJournalResponse | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string>('');

  const userEntries = entries.filter((e) => e.userId === user.uid);

  const handleSubmitQuestion = async (qToAsk?: string) => {
    const q = (qToAsk || question).trim();
    if (!q || isLoading) return;

    if (q.length < 2) {
      setError('Please enter a question with at least 2 characters.');
      return;
    }

    if (q.length > 500) {
      setError('Question exceeds the 500 character limit.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveQuestion(q);

    try {
      const response = await fetch('/api/gemini/ask-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: q,
          userId: user.uid,
          entries: userEntries.map((e) => ({
            id: e.id,
            title: e.title,
            content: e.content,
            mood: e.mood,
            tags: e.tags,
            createdAt: e.createdAt,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: AskJournalResponse = await response.json();
      setActiveResponse(data);

      // Append to local question history
      const newHistoryItem: AskJournalHistoryItem = {
        id: 'q-' + Date.now(),
        question: q,
        response: data,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
      setQuestion('');
    } catch (err: any) {
      console.error('Error querying Ask My Journal:', err);
      setError(err?.message || 'Failed to query your journal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveResponse(null);
    setActiveQuestion('');
    setError(null);
  };

  // If user has zero entries
  if (userEntries.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div 
          id="ask-journal-empty-state"
          className="bg-stone-900 border border-stone-800 rounded-2xl p-8 sm:p-12 text-center shadow-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-stone-100 mb-2">No Journal Entries to Query</h2>
          <p className="text-sm text-stone-400 max-w-md mx-auto mb-6 leading-relaxed">
            &quot;Ask My Journal&quot; analyzes your private reflection history with Gemini to answer questions about your habits, milestones, and thoughts. Write your first reflection to get started.
          </p>
          <button
            id="ask-empty-new-entry-btn"
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Write First Reflection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div 
        id="ask-journal-header"
        className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-stone-100 tracking-tight">Ask My Journal</h1>
              <span className="text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Gemini Grounded Q&A
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400">
              Query your authentic reflection history with natural language. Private, bounded, and strictly isolated to your account.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-950/70 border border-stone-800 rounded-xl text-xs text-stone-300">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{userEntries.length} {userEntries.length === 1 ? 'Entry' : 'Entries'} in Context</span>
            </div>
            {history.length > 0 && (
              <button
                id="clear-ask-history-btn"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-950/70 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 rounded-xl text-xs transition-colors cursor-pointer"
                title="Clear question history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Example Questions Carousel / Pills */}
        <div className="mt-5 pt-4 border-t border-stone-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2.5 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Example Questions you can ask:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((example, idx) => (
              <button
                key={idx}
                id={`example-q-chip-${idx}`}
                onClick={() => {
                  setQuestion(example);
                  handleSubmitQuestion(example);
                }}
                disabled={isLoading}
                className="text-left text-xs bg-stone-950/60 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &quot;{example}&quot;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div 
        id="ask-journal-input-card"
        className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitQuestion();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <div className="absolute top-3.5 left-3.5 text-stone-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <textarea
              id="ask-journal-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your journal entries (e.g. 'What have I accomplished this week?')..."
              rows={3}
              maxLength={500}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitQuestion();
                }
              }}
              className="w-full pl-10 pr-4 py-3 bg-stone-950/90 border border-stone-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 rounded-xl text-stone-100 text-sm placeholder-stone-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded in your private journal entries only</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-stone-400">
                {question.length}/500
              </span>
              <button
                id="ask-journal-submit-btn"
                type="submit"
                disabled={!question.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 text-stone-950 disabled:text-stone-500 font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Journal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div 
            id="ask-journal-error"
            className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div 
          id="ask-journal-loading"
          className="bg-stone-900/90 border border-stone-800 rounded-2xl p-8 text-center space-y-3 animate-pulse shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-stone-200">Reading and Grounding Answer</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Querying &quot;{activeQuestion}&quot; across your {userEntries.length} reflections without exposing secrets or instructions...
          </p>
        </div>
      )}

      {/* Active Response Display */}
      {activeResponse && !isLoading && (
        <div 
          id="ask-journal-active-response"
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-md space-y-6"
        >
          {/* Question Badge & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                Your Question
              </span>
              <h2 className="text-base font-semibold text-stone-100">
                &quot;{activeQuestion || activeResponse.questionAsked}&quot;
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activeResponse.hasSufficientContext ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Grounded in Journal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Limited Information
                </span>
              )}
            </div>
          </div>

          {/* Main Answer */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Grounded Reflection Answer</span>
            </h3>
            <div className="p-4 bg-stone-950/80 border border-stone-800/80 rounded-xl text-stone-200 text-sm leading-relaxed whitespace-pre-line">
              {activeResponse.answer}
            </div>
          </div>

          {/* Supporting Evidence / Entries */}
          {activeResponse.evidence && activeResponse.evidence.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Supporting Context from Your Journal</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeResponse.evidence.map((item, idx) => (
                  <div 
                    key={idx}
                    id={`evidence-card-${idx}`}
                    className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-300 truncate max-w-[200px]">
                        {item.entryTitle}
                      </span>
                      <span className="text-stone-400 shrink-0 font-mono text-[10px]">
                        {item.date}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 leading-normal">
                      {item.relevance}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Patterns & Practical Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patterns */}
            {activeResponse.keyPatterns && activeResponse.keyPatterns.length > 0 && (
              <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Patterns Noted</span>
                </h4>
                <ul className="space-y-2">
                  {activeResponse.keyPatterns.map((pat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{pat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {activeResponse.suggestions && activeResponse.suggestions.length > 0 && (
              <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mindful Suggestions</span>
                </h4>
                <ul className="space-y-2">
                  {activeResponse.suggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History of Previous Questions during session */}
      {history.length > 1 && (
        <div 
          id="ask-journal-history-section"
          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Previous Questions in this Session ({history.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {history.slice(1).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveQuestion(item.question);
                  setActiveResponse(item.response);
                }}
                className="p-3.5 bg-stone-950/80 hover:bg-stone-950 border border-stone-800/80 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-200 truncate max-w-md">
                    &quot;{item.question}&quot;
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-stone-400 line-clamp-1">
                  {item.response.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
