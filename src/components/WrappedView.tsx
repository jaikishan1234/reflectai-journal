import React from 'react';
import { Sparkles, Gift, Calendar, ArrowRight, BookOpen, Clock, Flame, ShieldCheck } from 'lucide-react';
import { UserProfile, JournalEntry } from '../types';

interface WrappedViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onBackToJournal: () => void;
}

export const WrappedView: React.FC<WrappedViewProps> = ({
  user,
  entries,
  onBackToJournal,
}) => {
  const userEntries = entries.filter((e) => e.userId === user.uid);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden space-y-8">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Gift className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Milestone Feature (Coming Soon)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
            ReflectAI Journal Wrapped
          </h1>

          <p className="text-stone-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Your personalized periodic milestone retrospective. Celebrate your moments of growth, peak creative focus hours, most recurring themes, and reflection milestones across time.
          </p>
        </div>

        {/* Milestone Snapshot preview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-5 space-y-2">
            <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Current Archive</span>
            </div>
            <div className="text-2xl font-bold text-stone-100">{userEntries.length}</div>
            <p className="text-xs text-stone-400">Total reflections logged in your private journal.</p>
          </div>

          <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-5 space-y-2">
            <div className="text-orange-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Streak & Cadence</span>
            </div>
            <div className="text-2xl font-bold text-stone-100">Daily Momentum</div>
            <p className="text-xs text-stone-400">Grounded cadence tracking and mindful consistency.</p>
          </div>

          <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-5 space-y-2">
            <div className="text-rose-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Annual Stories</span>
            </div>
            <div className="text-2xl font-bold text-stone-100">Yearly Retros</div>
            <p className="text-xs text-stone-400">Generative story capsules packaged at the close of each cycle.</p>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onBackToJournal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>Return to Journal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
