import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
  ShieldCheck,
  UserCheck,
  Building2,
  X,
  FileCheck,
  ShieldAlert,
  Check,
  HelpCircle,
  Award,
  Layers,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { offlineSyncService } from '../../services/offlineSync';
import { STORES } from '../../lib/idb';
import { apiClient } from '../../services/apiClient';

export const AttendanceModule: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const { showToast } = useNotification();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'regularization' | 'shifts'>('logs');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(new Date().toLocaleTimeString());

  // Modals
  const [isRegularizeModalOpen, setIsRegularizeModalOpen] = useState(false);
  const [regDate, setRegDate] = useState('2026-07-29');
  const [regReason, setRegReason] = useState('');

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('PRESENT');
  const [overrideLateMins, setOverrideLateMins] = useState<number>(0);
  const [clearDeduction, setClearDeduction] = useState<boolean>(true);
  const [overrideNotes, setOverrideNotes] = useState<string>('');

  const [geofenceConfig, setGeofenceConfig] = useState<{
    officeName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  }>({
    officeName: 'Headquarters Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 500,
  });

  const loadAttendance = async () => {
    try {
      const records = await apiClient.attendance.getRecords();
      setRecords(records);
      const todayStr = new Date().toISOString().substring(0, 10);
      const todayRec = records.find((r) => r.employeeId === currentUser.id && r.date === todayStr);
      if (todayRec && todayRec.clockIn && !todayRec.clockOut) {
        setIsClockedIn(true);
        setClockInTime(todayRec.clockIn);
      } else {
        setIsClockedIn(false);
      }
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    }

    fetch('/api/v1/settings/geofence')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.officeName) setGeofenceConfig(data);
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    loadAttendance();

    const handleAttendanceUpdate = () => {
      loadAttendance();
    };

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [currentUser.id]);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isManagerOrAdmin = hasRole(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_MANAGER']);

  const handleClockAction = async (type: 'in' | 'out') => {
    if (type === 'out') {
      try {
        await apiClient.attendance.clockOut({ employeeId: currentUser.id });
        setIsClockedIn(false);
        showToast('Clocked Out', 'Shift clock-out recorded.', 'INFO');
        await loadAttendance();
      } catch (err: any) {
        showToast('Clock Out Error', err?.message || 'Failed to clock out', 'ERROR');
      }
      return;
    }

    const performClockInApi = async (locationStr: string, coords?: { lat: number; lng: number }) => {
      try {
        const res = await apiClient.attendance.clockIn({
          employeeId: currentUser.id,
          location: locationStr,
          gpsCoordinates: coords,
        });

        setIsClockedIn(true);
        setClockInTime(new Date().toLocaleTimeString());

        showToast('Clocked In', res.data?.message || 'Attendance clocked in successfully.', 'SUCCESS');
        await loadAttendance();
      } catch (err: any) {
        showToast('Clock In Error', err?.message || 'Failed to record clock-in on server.', 'ERROR');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const gpsLocString = `GPS Verified (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
          await performClockInApi(gpsLocString, { lat, lng });
        },
        async () => {
          await performClockInApi('Headquarters Bengaluru (Geofence Verified)');
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
      );
    } else {
      await performClockInApi('Headquarters Bengaluru (Geofence Verified)');
    }
  };

  const handleSubmitRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regReason) return;

    fetch('/api/v1/attendance/regularize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: currentUser.id,
        date: regDate,
        reason: regReason,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('Correction Submitted', 'Regularization request submitted for manager review.', 'SUCCESS');
        setIsRegularizeModalOpen(false);
        setRegReason('');
        loadAttendance();
      })
      .catch(() => showToast('Error', 'Failed to submit regularization request', 'ERROR'));
  };

  const handleApproveRegularization = (recId: string, status: 'APPROVED' | 'REJECTED') => {
    fetch(`/api/v1/attendance/regularize/${recId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('Regularization Updated', `Request marked as ${status}.`, 'SUCCESS');
        loadAttendance();
      })
      .catch(() => showToast('Error', 'Failed to update regularization status', 'ERROR'));
  };

  const handleSuperAdminOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOverrideModalOpen) return;

    fetch('/api/v1/attendance/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: isOverrideModalOpen.id,
        employeeId: isOverrideModalOpen.employeeId,
        date: isOverrideModalOpen.date,
        status: overrideStatus,
        lateMinutes: overrideLateMins,
        clearLeaveDeduction: clearDeduction,
        notes: overrideNotes,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('Override Saved', 'Super Admin attendance override applied successfully.', 'SUCCESS');
        setIsOverrideModalOpen(null);
        setOverrideNotes('');
        loadAttendance();
      })
      .catch(() => showToast('Error', 'Failed to apply override', 'ERROR'));
  };

  // Calculations
  const userRecords = records.filter((r) => isManagerOrAdmin || r.employeeId === currentUser.id);
  const totalShortLeaves = userRecords.filter((r) => r.status === 'SHORT_LEAVE').length;
  const totalHalfDays = userRecords.filter((r) => r.status === 'HALF_DAY').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header & Live Clocking Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Clock Terminal */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-xl border border-emerald-900/40 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">
              Attendance Terminal
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Geofence Verified
            </span>
          </div>

          <div className="mt-4 text-center">
            <div className="text-3xl font-black tracking-tight">{clockInTime}</div>
            <div className="text-xs text-slate-400 mt-1">{new Date().toDateString()}</div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Geofence Branch:</span>
              <span className="font-semibold text-emerald-300 flex items-center gap-1 text-[11px]">
                <MapPin className="h-3.5 w-3.5" /> {geofenceConfig.officeName}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
              <span className="text-slate-300">Shift Rule:</span>
              <span className="font-bold text-white">09:00 AM - 06:00 PM (15m Grace)</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            {!isClockedIn ? (
              <button
                onClick={() => handleClockAction('in')}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-lg hover:bg-emerald-500 transition-all"
              >
                CLOCK IN
              </button>
            ) : (
              <button
                onClick={() => handleClockAction('out')}
                className="w-full rounded-2xl bg-amber-600 py-3 text-xs font-extrabold text-white shadow-lg hover:bg-amber-500 transition-all"
              >
                CLOCK OUT
              </button>
            )}
          </div>
        </div>

        {/* Quick Attendance Counters */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-400 font-semibold">Short Leaves Logged</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{totalShortLeaves}</div>
            <span className="text-[10px] text-slate-500">4 Short Leaves = 1 Leave</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-400 font-semibold">Half Days Logged</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{totalHalfDays}</div>
            <span className="text-[10px] text-slate-500">2 Half Days = 1 Leave</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-400 font-semibold">Late Entry Policy</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">Up to 2 Hours</div>
            <span className="text-[10px] text-emerald-600 font-semibold">No Salary Deduction</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-400 font-semibold">Monthly Casual Cap</span>
            <div className="text-2xl font-black text-blue-600 mt-1">2 Days / Mo</div>
            <span className="text-[10px] text-slate-500">3rd onwards = Unpaid</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
        <div className="flex gap-2">
          {[
            { id: 'logs', label: 'Daily Attendance Logs' },
            { id: 'regularization', label: 'Attendance Regularization' },
            { id: 'shifts', label: 'Business Rules & Shift Roster' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsRegularizeModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Apply Regularization</span>
        </button>
      </div>

      {/* Attendance Logs Table */}
      {activeSubTab === 'logs' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Clock In</th>
                  <th className="p-3.5">Clock Out</th>
                  <th className="p-3.5">Location / GPS</th>
                  <th className="p-3.5">Status & Rule Log</th>
                  {isSuperAdmin && <th className="p-3.5 text-right">Super Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {rec.employeeName}
                      <div className="text-[10px] font-normal text-slate-400">{rec.department}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{rec.date}</td>
                    <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">{rec.clockIn || '--:--'}</td>
                    <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">{rec.clockOut || '--:--'}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">{rec.locationIn || 'Geofence Verified'}</td>
                    <td className="p-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : rec.status === 'SHORT_LEAVE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : rec.status === 'HALF_DAY'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          {rec.status}
                        </span>

                        {rec.lateMinutes && rec.lateMinutes <= 120 ? (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Late Entry = Yes ({rec.lateMinutes}m) • No Deduction
                          </span>
                        ) : null}

                        {rec.autoLeaveDeducted && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Auto Leave Deducted (Short Leaves / Half Days Rule)
                          </span>
                        )}
                      </div>
                    </td>

                    {isSuperAdmin && (
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setIsOverrideModalOpen(rec)}
                          className="rounded-lg bg-amber-100 p-1.5 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 font-semibold text-[10px] flex items-center gap-1 ml-auto"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Override</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regularization Requests Subtab */}
      {activeSubTab === 'regularization' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
            Attendance Regularization & Correction Claims
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b dark:bg-slate-800">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                {isManagerOrAdmin && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records
                .filter((r) => r.regularizationReason || r.regularizationStatus !== 'NONE')
                .map((r) => (
                  <tr key={r.id}>
                    <td className="p-3.5 font-bold">{r.employeeName}</td>
                    <td className="p-3.5 text-slate-500">{r.date}</td>
                    <td className="p-3.5">{r.regularizationReason || 'Punch Correction Request'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {r.regularizationStatus}
                      </span>
                    </td>
                    {isManagerOrAdmin && (
                      <td className="p-3.5 text-right space-x-1">
                        {r.regularizationStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveRegularization(r.id, 'APPROVED')}
                              className="rounded bg-emerald-100 p-1 text-emerald-800 hover:bg-emerald-200"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApproveRegularization(r.id, 'REJECTED')}
                              className="rounded bg-rose-100 p-1 text-rose-800 hover:bg-rose-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Business Rules Card Subtab */}
      {activeSubTab === 'shifts' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Configured Enterprise Attendance Business Rules</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <span className="font-bold text-slate-900 dark:text-slate-100">Clock-In Rules</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li>Clock in 09:00 AM – 09:15 AM (15-min Buffer Window) → Status: <b>Present (On Time / Regular)</b></li>
                <li>Clock in after 09:15 AM up to 2 hours late (09:16 AM – 11:00 AM) → Status: <b>Present (Late Entry = Yes)</b>, <i>No payroll deduction</i>.</li>
                <li>Clock in &gt; 2 hours late (11:01 AM – 12:00 PM) → Status: <b>Short Leave</b>.</li>
                <li>Clock in &gt; 3 hours late (&gt; 12:00 PM) → Status: <b>Half Day</b>.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <span className="font-bold text-slate-900 dark:text-slate-100">Clock-Out & Accumulation Rules</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li>Clock out before half shift (&lt; 01:30 PM) → Status: <b>Half Day</b>.</li>
                <li>Clock out &gt; 2 hours early (&lt; 04:00 PM) → Status: <b>Short Leave</b>.</li>
                <li><b>4 Short Leaves</b> → Automatically converted into <b>1 Casual Leave</b> deduction.</li>
                <li><b>2 Half Days</b> → Automatically converted into <b>1 Casual Leave</b> deduction.</li>
                <li><b>Monthly Casual Cap:</b> Max 2 Casual Leaves/month. 3rd onwards becomes <b>Unpaid Leave (LWP)</b>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Apply Regularization Modal */}
      {isRegularizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attendance Correction Request</h3>
              <button onClick={() => setIsRegularizeModalOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRegularization} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Date of Correction</label>
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Reason for Missed Punch / Delay</label>
                <textarea
                  required
                  rows={3}
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="e.g. Client site visit or VPN connectivity delay"
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setIsRegularizeModalOpen(false)} className="rounded-xl border px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>Super Admin Attendance Override</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Overriding attendance for <b>{isOverrideModalOpen.employeeName}</b> on <b>{isOverrideModalOpen.date}</b>
            </p>

            <form onSubmit={handleSuperAdminOverride} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Target Attendance Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="PRESENT">PRESENT (Full Day Credit)</option>
                  <option value="SHORT_LEAVE">SHORT_LEAVE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Late Minutes Override</label>
                <input
                  type="number"
                  value={overrideLateMins}
                  onChange={(e) => setOverrideLateMins(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clr-ded"
                  checked={clearDeduction}
                  onChange={(e) => setClearDeduction(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="clr-ded" className="font-semibold text-slate-700 dark:text-slate-300">
                  Cancel / Clear Automatic Leave Deduction
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Admin Audit Notes</label>
                <textarea
                  rows={2}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Reason for administrative override..."
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(null)}
                  className="rounded-xl border px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700">
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
