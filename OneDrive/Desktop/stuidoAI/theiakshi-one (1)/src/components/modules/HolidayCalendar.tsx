import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  MapPin,
  Sparkles,
  Info,
  CalendarCheck,
  Search,
  X,
  Share2,
} from 'lucide-react';
import { Holiday, HolidayRegion, HolidayType, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface HolidayCalendarProps {
  embedded?: boolean;
}

export const HolidayCalendar: React.FC<HolidayCalendarProps> = ({ embedded = false }) => {
  const { currentRole, currentUser } = useAuth();
  const { showToast } = useNotification();

  const isManagerOrAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'HR_MANAGER' || currentRole === 'TEAM_MANAGER';

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'MONTH' | 'YEAR'>('LIST');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formState, setFormState] = useState<{
    title: string;
    date: string;
    region: HolidayRegion;
    type: HolidayType;
    description: string;
    icon: string;
    isRecurring: boolean;
  }>({
    title: '',
    date: new Date().toISOString().substring(0, 10),
    region: 'NATIONAL',
    type: 'MANDATORY',
    description: '',
    icon: '🗓️',
    isRecurring: true,
  });

  const fetchHolidays = () => {
    setLoading(true);
    fetch('/api/v1/holidays')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHolidays(data);
      })
      .catch((err) => console.error('Error fetching holidays:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormState({
      title: '',
      date: new Date().toISOString().substring(0, 10),
      region: (currentUser.region as HolidayRegion) || 'NATIONAL',
      type: 'MANDATORY',
      description: '',
      icon: '🗓️',
      isRecurring: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormState({
      title: holiday.title,
      date: holiday.date,
      region: holiday.region,
      type: holiday.type,
      description: holiday.description || '',
      icon: holiday.icon || '🗓️',
      isRecurring: holiday.isRecurring,
    });
    setIsModalOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.date) {
      showToast('Validation Error', 'Please enter title and date', 'WARNING');
      return;
    }

    const endpoint = editingHoliday ? `/api/v1/holidays/${editingHoliday.id}` : '/api/v1/holidays';
    const method = editingHoliday ? 'PUT' : 'POST';

    fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    })
      .then((res) => res.json())
      .then(() => {
        showToast(
          'Holiday Saved',
          editingHoliday ? `Updated ${formState.title}` : `Added ${formState.title} to Holiday Calendar`,
          'SUCCESS'
        );
        setIsModalOpen(false);
        fetchHolidays();
      })
      .catch(() => showToast('Error', 'Failed to save holiday', 'ERROR'));
  };

  const handleDeleteHoliday = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    fetch(`/api/v1/holidays/${id}`, { method: 'DELETE' })
      .then(() => {
        showToast('Holiday Removed', `Deleted ${title}`, 'INFO');
        fetchHolidays();
      })
      .catch(() => showToast('Error', 'Failed to delete holiday', 'ERROR'));
  };

  // Sync Calendar with Google Calendar
  const handleDownloadCalendar = () => {
    fetch('/api/v1/workspace/calendar/sync-holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holidays: filteredHolidays }),
    })
      .then((r) => r.json())
      .then((res) => {
        showToast(
          'Google Calendar Synced',
          res.message || `Synchronized ${filteredHolidays.length} holidays & occasions with Google Calendar`,
          'SUCCESS'
        );
      })
      .catch(() => showToast('Sync Error', 'Failed connecting to Google Calendar', 'ERROR'));
  };

  // Filtered List
  const filteredHolidays = holidays.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'ALL' || h.region === selectedRegion;
    const matchesType = selectedType === 'ALL' || h.type === selectedType;
    return matchesSearch && matchesRegion && matchesType;
  });

  const getRegionBadge = (region: HolidayRegion) => {
    switch (region) {
      case 'NATIONAL':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">National (All)</span>;
      case 'NORTH_INDIA':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">North Region</span>;
      case 'SOUTH_INDIA':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">South Region</span>;
    }
  };

  const getTypeBadge = (type: HolidayType) => {
    switch (type) {
      case 'MANDATORY':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">Mandatory</span>;
      case 'OPTIONAL':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">Optional</span>;
      case 'RESTRICTED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">Restricted</span>;
    }
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Enterprise Multi-Region Calendar
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Holiday Calendar 2026</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            National government holidays apply to all branches. Region-specific holidays are customized for North and South India enterprise office locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCalendar}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-white text-xs font-bold backdrop-blur-md transition-all border border-emerald-500/30 shadow-lg"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" /> Sync Google Calendar
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-2 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search holiday title or festival..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs w-full outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Region Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Regions</option>
              <option value="NATIONAL">National Only</option>
              <option value="NORTH_INDIA">North India</option>
              <option value="SOUTH_INDIA">South India</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="MANDATORY">Mandatory</option>
              <option value="OPTIONAL">Optional</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'LIST'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Side-by-Side Calendar
            </button>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'MONTH'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cards Grid
            </button>
          </div>
        </div>
      </div>

      {/* Holiday Content Grid / List / Side-by-Side */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No holidays found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search filters or region selections.</p>
        </div>
      ) : viewMode === 'LIST' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Mini Calendar Widget on Left (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" /> August 2026 Grid
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mandatory</span>
                <span className="flex items-center gap-1 text-purple-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Optional</span>
              </div>
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Offset for Aug 2026 starting on Sat */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 text-slate-300 dark:text-slate-700"></div>
              ))}
              {Array.from({ length: 31 }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const matchedHoliday = holidays.find((h) => h.date === dateStr);

                return (
                  <div
                    key={dayNum}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center font-medium transition-all ${
                      matchedHoliday
                        ? matchedHoliday.type === 'MANDATORY'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30'
                          : 'bg-purple-500/15 text-purple-700 dark:text-purple-400 font-bold border border-purple-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    title={matchedHoliday ? `${matchedHoliday.title} (${matchedHoliday.type})` : undefined}
                  >
                    <span>{dayNum}</span>
                    {matchedHoliday && (
                      <span className="text-[9px] truncate max-w-[45px] leading-tight font-extrabold mt-0.5">
                        {matchedHoliday.icon || '🎉'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holiday List Table on Right (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Holiday & Date</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Type</th>
                    {isManagerOrAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredHolidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{holiday.icon || '🗓️'}</span>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{holiday.title}</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{holiday.date} ({holiday.dayOfWeek})</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getRegionBadge(holiday.region)}</td>
                      <td className="px-4 py-3">{getTypeBadge(holiday.type)}</td>
                      {isManagerOrAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleOpenEditModal(holiday)} className="p-1 text-slate-400 hover:text-blue-600">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteHoliday(holiday.id, holiday.title)} className="p-1 text-slate-400 hover:text-rose-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHolidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {holiday.icon || '🗓️'}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {holiday.title}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        {holiday.date} ({holiday.dayOfWeek || '2026'})
                      </p>
                    </div>
                  </div>
                  {isManagerOrAdmin && (
                    <button
                      onClick={() => handleOpenEditModal(holiday)}
                      className="p-1.5 text-slate-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                  {holiday.description || 'Enterprise holiday observance across office locations.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                {getRegionBadge(holiday.region)}
                {getTypeBadge(holiday.type)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingHoliday ? 'Edit Holiday' : 'Add New Enterprise Holiday'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Holiday Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali - Festival of Lights"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emoji / Icon
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 🪔"
                    value={formState.icon}
                    onChange={(e) => setFormState({ ...formState, icon: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Applicable Region
                  </label>
                  <select
                    value={formState.region}
                    onChange={(e) =>
                      setFormState({ ...formState, region: e.target.value as HolidayRegion })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="NATIONAL">National (All Employees)</option>
                    <option value="NORTH_INDIA">North India</option>
                    <option value="SOUTH_INDIA">South India</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Holiday Type
                  </label>
                  <select
                    value={formState.type}
                    onChange={(e) =>
                      setFormState({ ...formState, type: e.target.value as HolidayType })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="MANDATORY">Mandatory Holiday</option>
                    <option value="OPTIONAL">Optional Holiday</option>
                    <option value="RESTRICTED">Restricted Holiday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details or holiday policy guidelines..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="recurring-check"
                  checked={formState.isRecurring}
                  onChange={(e) => setFormState({ ...formState, isRecurring: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="recurring-check" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Recurring Annual Holiday
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
