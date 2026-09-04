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
      className="w-full bg-[#1D2328] border border-[#30383F] rounded-2xl p-6 sm:p-8 mt-6 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-5 border-b border-[#30383F]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <MessageSquare className="w-4 h-4 text-[#4FA3D1]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-[#F4F1EA] tracking-tight">
              Deeper Dialogue
            </h4>
            <p className="text-xs text-[#A7ADB2] mt-0.5">
              Continue exploring your reflection with personalized follow-up guidance
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <span className="text-[11px] font-medium text-[#747C82] bg-[#171B1F] border border-[#30383F] px-2.5 py-1 rounded-full shrink-0 self-start sm:self-center">
            {messages.length} exchange{messages.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-8 px-4 bg-[#171B1F] border border-[#30383F] rounded-xl mb-5">
          <Sparkles className="w-5 h-5 mx-auto text-[#3282B8] mb-2.5" />
          <p className="text-sm font-medium text-[#F4F1EA]">Deepen your reflection</p>
          <p className="text-xs text-[#A7ADB2] mt-1 max-w-md mx-auto leading-relaxed">
            Have a question or want to explore patterns in this entry? Ask below to continue the dialogue with Gemini.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-5 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5 ${
                    isUser
                      ? 'bg-[#252C32] border border-[#30383F] text-[#A7ADB2]'
                      : 'bg-[#3282B8]/10 border border-[#3282B8]/25 text-[#4FA3D1]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed text-xs sm:text-sm ${
                    isUser
                      ? 'bg-[#171B1F] border border-[#30383F] border-r-2 border-r-[#3282B8] text-[#F4F1EA]'
                      : 'bg-[#171B1F] border border-[#30383F] text-[#F4F1EA]'
                  }`}
                >
                  <div className={`text-[11px] mb-1 font-medium ${isUser ? 'text-[#A7ADB2] text-right' : 'text-[#4FA3D1] text-left'}`}>
                    {isUser ? 'You' : 'Gemini Guidance'}
                  </div>
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#F4F1EA] leading-relaxed prose-p:my-1.5 prose-headings:text-[#F4F1EA] prose-headings:font-semibold prose-strong:text-[#F4F1EA] prose-ul:my-1.5 prose-li:my-0.5 prose-blockquote:border-l-2 prose-blockquote:border-l-[#3282B8] prose-blockquote:text-[#A7ADB2] prose-blockquote:pl-3">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                  <div className={`text-[10px] mt-2 text-[#747C82] font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex items-center gap-2.5 text-xs text-[#A7ADB2] p-3 bg-[#171B1F] rounded-xl border border-[#30383F] w-fit">
              <RotateCw className="w-3.5 h-3.5 text-[#3282B8] animate-spin" />
              <span className="text-[#F4F1EA]">Gemini is reflecting...</span>
            </div>
          )}
        </div>
      )}

      {/* Suggested Follow-up Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PROMPT_SUGGESTIONS.map((sugg, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(sugg)}
            disabled={isGenerating}
            className="text-xs text-[#A7ADB2] hover:text-[#F4F1EA] bg-[#171B1F] hover:bg-[#252C32] border border-[#30383F] hover:border-[#424B54] px-3 py-1.5 rounded-lg transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-[#3282B8] mr-1.5 font-medium">+</span>
            {sugg}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#171B1F] border border-[#30383F] focus-within:border-[#3282B8] rounded-xl p-1.5 transition-colors">
        <input
          id="conversation-thread-input"
          type="text"
          placeholder="Ask Gemini to elaborate, explore solutions, or question assumptions..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isGenerating}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#F4F1EA] placeholder-[#747C82] focus:outline-hidden min-w-0"
        />
        <button
          id="conversation-thread-send-btn"
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="p-2.5 bg-[#3282B8] hover:bg-[#4FA3D1] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title="Send follow-up"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
