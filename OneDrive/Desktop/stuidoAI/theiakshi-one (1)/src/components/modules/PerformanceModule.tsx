import React, { useState, useEffect } from 'react';
import { Award, Star, TrendingUp, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { PerformanceReview } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const PerformanceModule: React.FC = () => {
  const { openCopilotWithPrompt } = useNotification();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);

  useEffect(() => {
    fetch('/api/v1/performance/reviews')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      });
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Performance Management & 9-Box Matrix</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          KRA / KPI goal tracking, 360-degree feedback cycles, self-evaluations, and talent mapping.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">Active Cycle</span>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">H1 2026 Review Cycle</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">Average Org Rating</span>
          <div className="text-lg font-black text-amber-500 mt-1 flex items-center gap-1">
            <Star className="h-5 w-5 fill-amber-500" /> 4.65 / 5.0
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">KRA Completion Rate</span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">93.0% Achieved</div>
        </div>
      </div>

      {/* Review List Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Individual Performance Cards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{rev.employeeName}</h4>
                  <span className="text-xs text-slate-400">{rev.designation} • {rev.department}</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl text-xs font-bold dark:bg-amber-950/60 dark:text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-500" /> {rev.rating} / 5.0
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>KRA Achievement Goal Score</span>
                  <span className="text-emerald-600 font-bold">{rev.kraScore}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
                    style={{ width: `${rev.kraScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Manager Coaching Notes:</span>
                "{rev.managerComments}"
              </div>

              <button
                onClick={() => openCopilotWithPrompt(`Draft personalized growth goals and promotion recommendations for ${rev.employeeName}.`)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" /> AI Growth Coaching
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
