import React from 'react';
import { JournalEntry } from '../types';
import { X, Flame, BarChart2, Smile, Award, BookOpen, Clock } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  streakCount: number;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  entries,
  streakCount,
}) => {
  if (!isOpen) return null;

  const totalWords = entries.reduce((acc, curr) => {
    return acc + (curr.content ? curr.content.trim().split(/\s+/).length : 0);
  }, 0);

  const moodCounts = entries.reduce((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const aiReflectionsCount = entries.filter(e => !!e.aiResponse).length;

  const allTags = entries.flatMap(e => e.tags);
  const tagCounts = allTags.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="analytics-dashboard-modal"
        className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative text-stone-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-100">Journaling & Growth Insights</h2>
            <p className="text-xs text-stone-400">Reflection patterns across your private entries</p>
          </div>
        </div>

        {/* Overview Stats Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Current Streak</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-400">{streakCount} Days</div>
          </div>

          <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Entries</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-stone-100">{entries.length}</div>
          </div>

          <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Words Written</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">{totalWords}</div>
          </div>

          <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Reflections</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-400">{aiReflectionsCount}</div>
          </div>
        </div>

        {/* Mood Breakdown */}
        <div className="mb-6 p-4 bg-stone-950/60 border border-stone-800 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 mb-3">
            <Smile className="w-4 h-4 text-amber-400" />
            <span>Emotional & Mood Distribution:</span>
          </div>

          <div className="space-y-2">
            {['thoughtful', 'motivated', 'peaceful', 'anxious', 'energized', 'overwhelmed'].map(mood => {
              const count = moodCounts[mood] || 0;
              const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
              return (
                <div key={mood} className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-400 capitalize">
                    <span>{mood}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Recurring Topics / Tags */}
        <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl">
          <div className="text-xs font-semibold text-stone-300 mb-2">
            Top Themes & Topics Explored:
          </div>
          {sortedTags.length === 0 ? (
            <p className="text-xs text-stone-500">No tags added yet. Add tags like #Career, #Growth to your entries.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-stone-800 text-stone-300 text-xs rounded-lg border border-stone-700 flex items-center gap-1.5"
                >
                  <span className="text-amber-400 font-medium">#{tag}</span>
                  <span className="text-[10px] bg-stone-900 px-1.5 py-0.5 rounded text-stone-400">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
