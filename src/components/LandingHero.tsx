import React from 'react';
import { Sparkles, Shield, Lock, Compass, Flame, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onSignIn: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 sm:py-16 text-stone-100">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400 font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.6 Flash + Cloud Firestore</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-100 leading-tight">
          Reflect deeper with intelligent, private AI insights.
        </h1>

        <p className="text-sm sm:text-base text-stone-400 mt-4 leading-relaxed">
          Write multi-turn reflections, journal daily thoughts, and receive empathetic summaries and structured action plans from Gemini. Protected by strict owner-bound Firestore isolation.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="hero-signin-primary-cta"
            onClick={onSignIn}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* Feature 1 */}
        <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-stone-200">Multi-Turn AI Reflections</h3>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            Converse back-and-forth with Gemini on any journal entry. Brainstorm ideas, request weekly summaries, or build concrete 3-step action plans.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-stone-200">Strict User Isolation</h3>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            Every entry is strictly partitioned to your individual user ID in Cloud Firestore. No user can ever access or read another user's reflections.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-stone-200">Habit Streaks & Insights</h3>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            Track your reflection momentum, mood distribution, recurring topics, and growth over time with interactive analytics.
          </p>
        </div>
      </div>

      {/* Security Architecture Footnote */}
      <div className="mt-12 p-4 bg-stone-900/40 border border-stone-800/80 rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-stone-400">
            Complies with OWASP Top 10, Zero-Hardcoding Secret Manager hygiene, and Cloud Run production standards.
          </span>
        </div>
        <span className="text-xs text-amber-400 font-medium">Ready to Deploy</span>
      </div>
    </div>
  );
};
