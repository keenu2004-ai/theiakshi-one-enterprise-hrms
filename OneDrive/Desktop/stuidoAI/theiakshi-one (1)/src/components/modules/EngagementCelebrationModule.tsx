import React, { useState, useEffect } from 'react';
import {
  PartyPopper,
  Cake,
  Award,
  Calendar,
  Sparkles,
  MapPin,
  Heart,
  MessageSquare,
  Plus,
  Send,
  X,
  Users2,
  Check,
} from 'lucide-react';
import { CelebrationEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface EngagementCelebrationModuleProps {
  embedded?: boolean;
}

export const EngagementCelebrationModule: React.FC<EngagementCelebrationModuleProps> = ({
  embedded = false,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useNotification();

  const isManagerOrAdmin =
    currentRole === 'SUPER_ADMIN' || currentRole === 'HR_MANAGER' || currentRole === 'TEAM_MANAGER';

  const [celebrations, setCelebrations] = useState<CelebrationEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wishedIds, setWishedIds] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formState, setFormState] = useState<{
    title: string;
    description: string;
    date: string;
    type: 'BIRTHDAY' | 'WORK_ANNIVERSARY' | 'PROMOTION' | 'FESTIVAL' | 'CUSTOM_EVENT';
    location: string;
    employeeName: string;
  }>({
    title: '',
    description: '',
    date: new Date().toISOString().substring(0, 10),
    type: 'CUSTOM_EVENT',
    location: 'Cafeteria, Floor 3 & Virtual Link',
    employeeName: '',
  });

  const fetchCelebrations = () => {
    setLoading(true);
    fetch('/api/v1/celebrations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCelebrations(data);
      })
      .catch((err) => console.error('Error loading celebrations:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCelebrations();
  }, []);

  const handleSendWish = (id: string, name: string) => {
    setWishedIds((prev) => ({ ...prev, [id]: true }));
    showToast('Wish Sent! 🎉', `Sent warm celebration wishes to ${name}!`, 'SUCCESS');
  };

  const handleCreateCelebration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.date) {
      showToast('Validation Error', 'Please enter title and date', 'WARNING');
      return;
    }

    fetch('/api/v1/celebrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Event Scheduled', `Created celebration: ${formState.title}`, 'SUCCESS');
        setIsModalOpen(false);
        fetchCelebrations();
      })
      .catch(() => showToast('Error', 'Failed to create celebration event', 'ERROR'));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BIRTHDAY':
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 flex items-center gap-1">
            <Cake className="w-3 h-3" /> Birthday
          </span>
        );
      case 'WORK_ANNIVERSARY':
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Award className="w-3 h-3" /> Work Anniversary
          </span>
        );
      case 'FESTIVAL':
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <PartyPopper className="w-3 h-3" /> Festival
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Team Activity
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-900 via-purple-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-pink-900/60">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-bold uppercase tracking-wider mb-1">
            <PartyPopper className="w-4 h-4" /> Smart Employee Engagement
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Celebrations & Milestones
          </h2>
          <p className="text-xs text-pink-100/80 mt-1 max-w-2xl">
            Automated reminders for employee birthdays, work anniversaries, company milestones, cultural festivals, and team bonding events.
          </p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {celebrations.map((event) => {
            const hasWished = wishedIds[event.id];

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {getTypeBadge(event.type)}
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" /> {event.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    {event.avatar ? (
                      <img
                        src={event.avatar}
                        alt={event.employeeName || 'Employee'}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-pink-500/30 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                        🎉
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-pink-500" /> {event.location}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-purple-500" /> {event.attendeesCount || 25} Participants
                  </span>

                  <button
                    onClick={() =>
                      handleSendWish(
                        event.id,
                        event.employeeName || event.title
                      )
                    }
                    disabled={hasWished}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      hasWished
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-pink-600 hover:bg-pink-500 text-white shadow-sm shadow-pink-500/20'
                    }`}
                  >
                    {hasWished ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Wish Sent
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5 fill-current" /> Send Wish
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Schedule Engagement Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCelebration} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 All-Hands Townhall & Team Lunch"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formState.type}
                    onChange={(e) =>
                      setFormState({ ...formState, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    <option value="CUSTOM_EVENT">Team Event / Outing</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="WORK_ANNIVERSARY">Work Anniversary</option>
                    <option value="PROMOTION">Promotion / Kudos</option>
                    <option value="FESTIVAL">Cultural Festival</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue / Location / Link
                </label>
                <input
                  type="text"
                  placeholder="Cafeteria, Floor 3 & Zoom Stream"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding food, schedule, or team activities..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-500/20"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
