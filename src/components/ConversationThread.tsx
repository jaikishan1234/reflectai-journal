import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { Send, User, Sparkles, RotateCw, MessageSquare } from 'lucide-react';

interface ConversationThreadProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  messages,
  onSendMessage,
  isGenerating,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const PROMPT_SUGGESTIONS = [
    'How can I break this down into smaller milestones?',
    'What blind spots might I be missing here?',
    'Can you help me reframe this positively?',
  ];

  return (
    <div 
      id="journal-conversation-thread"
      className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl mt-6"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-stone-200">Continuous Dialogue with Gemini</h4>
        </div>
        <span className="text-[11px] text-stone-500">{messages.length} message{messages.length === 1 ? '' : 's'}</span>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-6 text-stone-500 text-xs">
          <Sparkles className="w-6 h-6 mx-auto text-stone-600 mb-2" />
          <p>Have a question or need to go deeper into your journal entry?</p>
          <p className="text-[11px] text-stone-600 mt-1">Type below to start a multi-turn conversation with Gemini.</p>
        </div>
      ) : (
        <div className="space-y-3.5 mb-4 max-h-[400px] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                    isUser
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-amber-400 border border-stone-700'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500/15 border border-amber-500/30 text-stone-100'
                      : 'bg-stone-950 border border-stone-800 text-stone-200'
                  }`}
                >
                  <div className="prose prose-invert max-w-none text-xs">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                  <div className={`text-[9px] mt-1 text-stone-500 ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-amber-400 p-2 bg-stone-950/60 rounded-xl border border-stone-800/80 w-fit">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Gemini is thinking...</span>
            </div>
          )}
        </div>
      )}

      {/* Suggested Follow-up Buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PROMPT_SUGGESTIONS.map((sugg, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(sugg)}
            disabled={isGenerating}
            className="text-[10px] text-stone-400 hover:text-amber-300 bg-stone-950 hover:bg-stone-850 border border-stone-800 px-2 py-1 rounded-md transition-colors text-left cursor-pointer disabled:opacity-40"
          >
            + {sugg}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          id="conversation-thread-input"
          type="text"
          placeholder="Ask Gemini to elaborate, explore solutions, or question assumptions..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isGenerating}
          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500/50"
        />
        <button
          id="conversation-thread-send-btn"
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="p-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all font-semibold cursor-pointer disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
