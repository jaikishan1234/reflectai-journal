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
            youtubeAttachment: e.youtubeAttachment || null,
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
          className="bg-[#171B1F] border border-[#30383F] rounded-2xl p-8 sm:p-12 text-center shadow-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1] flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#F4F1EA] mb-2 tracking-tight">No Reflections to Query Yet</h2>
          <p className="text-sm text-[#A7ADB2] max-w-md mx-auto mb-6 leading-relaxed">
            Ask My Journal draws directly upon your private reflection history to find patterns, answer questions about past decisions, and surface mindful insights. Write your first reflection to begin.
          </p>
          <button
            id="ask-empty-new-entry-btn"
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3282B8] hover:bg-[#4FA3D1] text-white font-medium text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
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
      {/* Header Section */}
      <div 
        id="ask-journal-header"
        className="bg-[#171B1F] border border-[#30383F] rounded-2xl p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#F4F1EA] tracking-tight">Ask My Journal</h1>
              <span className="text-[11px] font-semibold bg-[#3282B8]/10 text-[#4FA3D1] border border-[#3282B8]/25 px-2.5 py-0.5 rounded-full">
                Grounded in Your Writing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A7ADB2]">
              Ask questions about your own writing. ReflectAI synthesizes answers drawn exclusively from your personal journal entries.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D2328] border border-[#30383F] rounded-xl text-xs text-[#F4F1EA]">
              <BookOpen className="w-3.5 h-3.5 text-[#4FA3D1]" />
              <span>{userEntries.length} {userEntries.length === 1 ? 'Reflection' : 'Reflections'} in Context</span>
            </div>
            {history.length > 0 && (
              <button
                id="clear-ask-history-btn"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D2328] hover:bg-[#252C32] border border-[#30383F] text-[#A7ADB2] hover:text-[#F4F1EA] rounded-xl text-xs transition-colors cursor-pointer"
                title="Clear question history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Example Questions Inquiries */}
        <div className="mt-5 pt-4 border-t border-[#30383F]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#747C82] mb-2.5 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#4FA3D1]" />
            <span>Example inquiries you can explore:</span>
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
                className="text-left text-xs bg-[#1D2328] hover:bg-[#252C32] border border-[#30383F] hover:border-[#4FA3D1]/50 text-[#A7ADB2] hover:text-[#F4F1EA] px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &quot;{example}&quot;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Input Surface */}
      <div 
        id="ask-journal-input-card"
        className="bg-[#171B1F] border border-[#30383F] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitQuestion();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <div className="absolute top-3.5 left-3.5 text-[#747C82] pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <textarea
              id="ask-journal-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your reflections (e.g., 'What patterns keep coming up in my writing?')..."
              rows={3}
              maxLength={500}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitQuestion();
                }
              }}
              className="w-full pl-10 pr-4 py-3 bg-[#1D2328] border border-[#30383F] focus:border-[#4FA3D1] focus:ring-1 focus:ring-[#4FA3D1] rounded-xl text-[#F4F1EA] text-sm placeholder-[#747C82] outline-none resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-[#A7ADB2]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Grounded strictly in your private reflections</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#747C82] font-mono">
                {question.length}/500
              </span>
              <button
                id="ask-journal-submit-btn"
                type="submit"
                disabled={!question.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#3282B8] hover:bg-[#4FA3D1] disabled:bg-[#1D2328] text-white disabled:text-[#747C82] font-semibold text-xs rounded-xl border border-transparent disabled:border-[#30383F] transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching Journal...</span>
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
            className="p-3.5 bg-[#F87171]/10 border border-[#F87171]/25 rounded-xl flex items-center gap-2.5 text-xs text-[#F87171]"
          >
            <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div 
          id="ask-journal-loading"
          className="bg-[#171B1F] border border-[#30383F] rounded-2xl p-8 text-center space-y-3 animate-pulse shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-[#F4F1EA]">Reading and Grounding Answer</h3>
          <p className="text-xs text-[#A7ADB2] max-w-sm mx-auto">
            Reviewing &quot;{activeQuestion}&quot; across your {userEntries.length} journal reflections...
          </p>
        </div>
      )}

      {/* Active Response Display */}
      {activeResponse && !isLoading && (
        <div 
          id="ask-journal-active-response"
          className="bg-[#171B1F] border border-[#30383F] rounded-2xl p-6 shadow-md space-y-6"
        >
          {/* Question Banner & Grounding Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30383F]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#4FA3D1]">
                Your Question
              </span>
              <h2 className="text-base font-semibold text-[#F4F1EA]">
                &quot;{activeQuestion || activeResponse.questionAsked}&quot;
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activeResponse.hasSufficientContext ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/25 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Grounded in Journal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/25 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Limited Entries Found
                </span>
              )}
            </div>
          </div>

          {/* Main Answer - Editorial Presentation */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A7ADB2] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#4FA3D1]" />
              <span>Grounded Reflection Answer</span>
            </h3>
            <div className="p-4 bg-[#1D2328] border border-[#30383F] rounded-xl text-[#F4F1EA] text-sm leading-relaxed whitespace-pre-line">
              {activeResponse.answer}
            </div>
          </div>

          {/* Supporting Evidence / Entries Cited */}
          {activeResponse.evidence && activeResponse.evidence.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A7ADB2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#4FA3D1]" />
                <span>Supporting Reflections from Your Journal</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeResponse.evidence.map((item, idx) => (
                  <div 
                    key={idx}
                    id={`evidence-card-${idx}`}
                    className="p-3.5 bg-[#1D2328] border border-[#30383F] hover:border-[#3282B8]/40 transition-colors rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#BBE1FA] truncate max-w-[200px]">
                        {item.entryTitle}
                      </span>
                      <span className="text-[#747C82] shrink-0 font-mono text-[10px]">
                        {item.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#A7ADB2] leading-normal">
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
              <div className="p-4 bg-[#1D2328] border border-[#30383F] rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F1EA] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#4FA3D1]" />
                  <span>Key Patterns Noted</span>
                </h4>
                <ul className="space-y-2">
                  {activeResponse.keyPatterns.map((pat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#A7ADB2]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4FA3D1] mt-1.5 shrink-0" />
                      <span className="text-[#F4F1EA]">{pat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {activeResponse.suggestions && activeResponse.suggestions.length > 0 && (
              <div className="p-4 bg-[#1D2328] border border-[#30383F] rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F1EA] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#F2B66D]" />
                  <span>Mindful Suggestions</span>
                </h4>
                <ul className="space-y-2">
                  {activeResponse.suggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#A7ADB2]">
                      <ArrowRight className="w-3.5 h-3.5 text-[#4FA3D1] mt-0.5 shrink-0" />
                      <span className="text-[#F4F1EA]">{sug}</span>
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
          className="bg-[#171B1F] border border-[#30383F] rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A7ADB2] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4FA3D1]" />
              <span>Previous Inquiries in this Session ({history.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {history.slice(1).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveQuestion(item.question);
                  setActiveResponse(item.response);
                }}
                className="p-3.5 bg-[#1D2328] hover:bg-[#252C32] border border-[#30383F] hover:border-[#3282B8]/50 rounded-xl cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F4F1EA] truncate max-w-md">
                    &quot;{item.question}&quot;
                  </span>
                  <span className="text-[10px] text-[#747C82] font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#A7ADB2] line-clamp-1">
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
