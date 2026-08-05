import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Clock, MessageSquare, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { HelpdeskTicket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const HelpdeskModule: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'IT_SUPPORT' | 'PAYROLL_QUERY' | 'HR_POLICY' | 'FACILITIES' | 'HARDWARE'>('IT_SUPPORT');
  const [description, setDescription] = useState('');

  const loadTickets = () => {
    fetch('/api/v1/helpdesk/tickets')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTickets(data);
      });
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    fetch('/api/v1/helpdesk/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: currentUser.id,
        category,
        subject,
        description,
        priority: 'MEDIUM',
      }),
    })
      .then((r) => r.json())
      .then((created) => {
        showToast('Ticket Created', `Logged support request #${created.ticketNumber}`, 'SUCCESS');
        setIsModalOpen(false);
        setSubject('');
        setDescription('');
        loadTickets();
      });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">IT & HR Helpdesk Support</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit support tickets for hardware requests, payroll clarifications, IT access, and facilities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Raise Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((tkt) => (
          <div
            key={tkt.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{tkt.ticketNumber}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {tkt.category}
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {tkt.priority} Priority
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{tkt.subject}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tkt.description}</p>
              <div className="text-[10px] text-slate-400 pt-1">
                Requested by {tkt.requesterName} • Assigned to {tkt.assignedTo} • {tkt.createdAt}
              </div>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  tkt.status === 'OPEN'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {tkt.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Raise Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Raise Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                >
                  <option value="IT_SUPPORT">IT Support & Access</option>
                  <option value="HARDWARE">Hardware & Monitors</option>
                  <option value="PAYROLL_QUERY">Payroll & Tax Query</option>
                  <option value="HR_POLICY">HR Policy Clarification</option>
                  <option value="FACILITIES">Facilities & Desk</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Request for second monitor"
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Detailed Request</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or requirement..."
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
