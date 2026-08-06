import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  Check,
  X,
  FileText,
  Search,
  Building2,
  Tag,
  Calendar,
  User,
  Download,
  AlertCircle,
  MessageSquare,
  Eye,
  RefreshCw,
  Layers,
  Send,
  CreditCard,
  MapPin,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ExpenseClaim, ExpenseCategoryConfig, Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { unwrapArray } from '../../lib/apiHelper';

export const ExpensesModule: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const { showToast } = useNotification();
  const isApprover = hasRole(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_MANAGER', 'FINANCE']);

  // 1. Tab State: 'summary' | 'logs' | 'requests'
  const [activeTab, setActiveTab] = useState<'summary' | 'logs' | 'requests'>('summary');

  // Data States
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<Project[]>([]);

  // Requests Tab Filter: 'PENDING' | 'APPROVED' | 'REJECTED'
  const [requestsFilter, setRequestsFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Logs Tab Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal States
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState<boolean>(false);
  const [viewingClaim, setViewingClaim] = useState<ExpenseClaim | null>(null);
  const [commentsModalClaim, setCommentsModalClaim] = useState<ExpenseClaim | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Form State for New Expense Creation
  const [formState, setFormState] = useState({
    purpose: '',
    category: 'Business Expense',
    merchant: '',
    transactionDate: new Date().toISOString().substring(0, 10),
    amount: '',
    currency: 'INR',
    bucket: 'Internal',
    modeOfTransport: '',
    startingPoint: '',
    destination: '',
    projectName: '',
    billFileName: '',
  });

  // Fetch Expense Data from API
  const fetchExpenses = () => {
    setLoading(true);
    fetch('/api/v1/expenses')
      .then((res) => res.json())
      .then((data) => {
        const list = unwrapArray<ExpenseClaim>(data);
        setExpenses(list);
      })
      .catch((err) => {
        console.error('Failed to fetch expenses:', err);
        showToast('Fetch Error', 'Failed to load expense records.', 'ERROR');
      })
      .finally(() => setLoading(false));
  };

  const fetchProjects = () => {
    fetch('/api/v1/projects')
      .then((res) => res.json())
      .then((data) => setProjects(unwrapArray<Project>(data)))
      .catch((err) => console.error('Failed to fetch projects:', err));
  };

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
  }, []);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    let totalClaimed = 0;
    let approvedPayout = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    expenses.forEach((claim) => {
      const amt = claim.amount || 0;
      totalClaimed += amt;

      if (
        claim.status === 'APPROVED' ||
        claim.status === 'APPROVED_BY_FINANCE' ||
        claim.status === 'PAID'
      ) {
        approvedPayout += amt;
      } else if (
        claim.status === 'PENDING' ||
        claim.status === 'SUBMITTED' ||
        claim.status === 'APPROVED_BY_MANAGER'
      ) {
        pendingCount += 1;
      } else if (claim.status === 'REJECTED') {
        rejectedCount += 1;
      }
    });

    return {
      totalClaimed,
      approvedPayout,
      pendingCount,
      rejectedCount,
    };
  }, [expenses]);

  // Categories list derived from expenses
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  // Filtered Expenses for Logs Tab
  const filteredLogs = useMemo(() => {
    return expenses.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.purpose && item.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.merchant && item.merchant.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  // Filtered Expenses for Requests (Action Center) Tab
  const filteredRequests = useMemo(() => {
    return expenses.filter((item) => {
      if (requestsFilter === 'PENDING') {
        return (
          item.status === 'PENDING' ||
          item.status === 'SUBMITTED' ||
          item.status === 'APPROVED_BY_MANAGER'
        );
      }
      if (requestsFilter === 'APPROVED') {
        return (
          item.status === 'APPROVED' ||
          item.status === 'APPROVED_BY_FINANCE' ||
          item.status === 'PAID'
        );
      }
      if (requestsFilter === 'REJECTED') {
        return item.status === 'REJECTED';
      }
      return true;
    });
  }, [expenses, requestsFilter]);

  // Status Badge Helper Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'APPROVED_BY_FINANCE':
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>APPROVED</span>
          </span>
        );
      case 'PENDING':
      case 'SUBMITTED':
      case 'APPROVED_BY_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>PENDING</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
            <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>REJECTED</span>
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>{status}</span>
          </span>
        );
    }
  };

  // Actions: Approve / Reject
  const handleUpdateStatus = (claimId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const approverName = `${currentUser.firstName} ${currentUser.lastName}`;

    fetch(`/api/v1/expenses/${claimId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        approvedBy: approverName,
        actorRole: currentUser.role,
        note: `Claim marked as ${newStatus} by ${approverName}`,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update status');
        return res.json();
      })
      .then((updated) => {
        setExpenses((prev) =>
          prev.map((item) => (item.id === claimId ? { ...item, status: newStatus } : item))
        );
        showToast(
          'Expense Updated',
          `Claim #${updated.claimNumber || claimId} has been ${newStatus.toLowerCase()}.`,
          newStatus === 'APPROVED' ? 'SUCCESS' : 'INFO'
        );
      })
      .catch((err) => {
        console.error('Error updating status:', err);
        showToast('Action Failed', 'Could not update expense status.', 'ERROR');
      });
  };

  // Handle New Expense Form Submission
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.purpose || !formState.amount) {
      showToast('Required Fields', 'Please fill in purpose and amount.', 'ERROR');
      return;
    }

    const payload = {
      employeeId: currentUser.id,
      purpose: formState.purpose,
      category: formState.category,
      merchant: formState.merchant || 'General Merchant',
      transactionDate: formState.transactionDate,
      amount: parseFloat(formState.amount) || 0,
      currency: formState.currency || 'INR',
      bucket: formState.bucket || 'Internal',
      projectName: formState.projectName || undefined,
      billFileName: formState.billFileName || 'Receipt.pdf',
      status: 'PENDING',
    };

    fetch('/api/v1/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((created) => {
        setExpenses((prev) => [created, ...prev]);
        showToast('Expense Created', `Claim ${created.claimNumber} submitted successfully.`, 'SUCCESS');
        setIsNewExpenseModalOpen(false);
        setFormState({
          purpose: '',
          category: 'Business Expense',
          merchant: '',
          transactionDate: new Date().toISOString().substring(0, 10),
          amount: '',
          currency: 'INR',
          bucket: 'Internal',
          modeOfTransport: '',
          startingPoint: '',
          destination: '',
          projectName: '',
          billFileName: '',
        });
      })
      .catch((err) => {
        console.error('Error creating expense:', err);
        showToast('Error', 'Failed to create expense claim.', 'ERROR');
      });
  };

  // Comments Submission
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentsModalClaim || !newCommentText.trim()) return;

    fetch(`/api/v1/expenses/${commentsModalClaim.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorRole: currentUser.role,
        avatar: currentUser.avatar,
        text: newCommentText.trim(),
      }),
    })
      .then((res) => res.json())
      .then((added) => {
        const updatedList = [...(commentsModalClaim.commentsList || []), added];
        const updatedClaim = { ...commentsModalClaim, commentsList: updatedList };
        setCommentsModalClaim(updatedClaim);
        setExpenses((prev) => prev.map((item) => (item.id === updatedClaim.id ? updatedClaim : item)));
        setNewCommentText('');
        showToast('Comment Posted', 'Comment added to claim record.', 'SUCCESS');
      })
      .catch(() => showToast('Error', 'Failed to post comment.', 'ERROR'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16">
      {/* Module Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Expense Management</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track corporate reimbursements, logs, and approval requests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchExpenses}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsNewExpenseModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 2: Top Navigation (The Three Tabs) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 w-full max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3.5 text-center text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              Summary
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3.5 text-center text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              Logs
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3.5 text-center text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'requests'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              Requests
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* REQUIREMENT 3: Tab 1 - Summary View */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4 Metric Cards Grid (1 col on mobile, 4 on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total Claimed Amount */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Claimed
                  </span>
                  <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    ₹{metrics.totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Across all employee claims</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/50">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>

              {/* Metric 2: Approved Payout */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Approved Payout
                  </span>
                  <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    ₹{metrics.approvedPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                    Verified for reimbursement
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>

              {/* Metric 3: Pending Approvals */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pending Approvals
                  </span>
                  <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                    {metrics.pendingCount} <span className="text-sm font-semibold">Claims</span>
                  </div>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                    Awaiting manager action
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <Clock className="h-6 w-6" />
                </div>
              </div>

              {/* Metric 4: Rejected Claims */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rejected Claims
                  </span>
                  <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                    {metrics.rejectedCount} <span className="text-sm font-semibold">Claims</span>
                  </div>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                    Declined / Returned
                  </p>
                </div>
                <div className="p-3 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/50">
                  <XCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Expense Breakdown */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Category Breakdown
                    </h2>
                    <p className="text-xs text-slate-500">Distribution of claims by category</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>View All Logs</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {categoriesList.slice(0, 5).map((catName) => {
                    const categoryTotal = expenses
                      .filter((e) => e.category === catName)
                      .reduce((sum, item) => sum + item.amount, 0);
                    const percent = metrics.totalClaimed > 0 ? (categoryTotal / metrics.totalClaimed) * 100 : 0;

                    return (
                      <div key={catName} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{catName}</span>
                          <span className="text-slate-900 dark:text-slate-100">
                            ₹{categoryTotal.toLocaleString('en-IN')} ({percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percent, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Hub / Pending Requests Highlight */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800/40 inline-block mb-3">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Action Center
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    You have <strong className="text-slate-800 dark:text-slate-200">{metrics.pendingCount}</strong> pending claims that require approval.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setRequestsFilter('PENDING');
                      setActiveTab('requests');
                    }}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Review Pending Requests</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsNewExpenseModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>File New Claim</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REQUIREMENT 4: Tab 2 - Logs View */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by claim #, employee, category..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Category:
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabular List View */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Claim # & Employee</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Merchant / Purpose</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">No expense records match your filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            <div>{item.claimNumber}</div>
                            <div className="text-[11px] font-normal text-slate-500">{item.employeeName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {item.transactionDate || item.appliedOn || '2026-07-30'}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {item.category}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.merchant || 'General'}
                            </span>
                            {item.purpose && <span className="block text-[11px] truncate">{item.purpose}</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(item.status)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingClaim(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => setCommentsModalClaim(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all relative"
                                title="Comments"
                              >
                                <MessageSquare className="h-4 w-4" />
                                {item.commentsList && item.commentsList.length > 0 && (
                                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-600" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REQUIREMENT 5: Tab 3 - Requests (Action Center) View */}
        {activeTab === 'requests' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Row of Pill-Shaped Filter Buttons at Top */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">Filter Requests:</span>

              {/* PENDING Pill */}
              <button
                onClick={() => setRequestsFilter('PENDING')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  requestsFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>PENDING</span>
                {requestsFilter === 'PENDING' && <X className="h-3.5 w-3.5 stroke-[3]" />}
              </button>

              {/* APPROVED Pill */}
              <button
                onClick={() => setRequestsFilter('APPROVED')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  requestsFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>APPROVED</span>
                {requestsFilter === 'APPROVED' && <X className="h-3.5 w-3.5 stroke-[3]" />}
              </button>

              {/* REJECTED Pill */}
              <button
                onClick={() => setRequestsFilter('REJECTED')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  requestsFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>REJECTED</span>
                {requestsFilter === 'REJECTED' && <X className="h-3.5 w-3.5 stroke-[3]" />}
              </button>
            </div>

            {/* Empty State UI */}
            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full inline-block">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No {requestsFilter.toLowerCase()} requests
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  There are no {requestsFilter.toLowerCase()} expense claims to display at this time.
                </p>
              </div>
            ) : (
              /* Request Action Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          {claim.claimNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {claim.employeeName}
                        </h3>
                        <p className="text-xs text-slate-500">{claim.department || 'Operations'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                          ₹{claim.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {renderStatusBadge(claim.status)}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Category</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{claim.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.transactionDate || claim.appliedOn || '2026-07-30'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Merchant & Purpose</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.merchant ? `${claim.merchant} — ` : ''}
                          {claim.purpose || 'Official Business'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setViewingClaim(claim)}
                        className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>

                      {/* Explicit Approve and Reject Action Buttons for Pending Items */}
                      {(claim.status === 'PENDING' || claim.status === 'SUBMITTED' || claim.status === 'APPROVED_BY_MANAGER') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(claim.id, 'REJECTED')}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(claim.id, 'APPROVED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE NEW EXPENSE MODAL */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 space-y-4 my-auto shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Submit Expense Claim
                </h3>
              </div>
              <button
                onClick={() => setIsNewExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Purpose / Notes *
                </label>
                <textarea
                  value={formState.purpose}
                  onChange={(e) => setFormState({ ...formState, purpose: e.target.value })}
                  placeholder="e.g., Client lunch meeting at Leela Palace"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Business Expense">Business Expense</option>
                    <option value="Local Travel Expense">Local Travel Expense</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Office Supply">Office Supply</option>
                    <option value="Courier">Courier</option>
                    <option value="Trip Expense">Trip Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formState.amount}
                    onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={formState.merchant}
                    onChange={(e) => setFormState({ ...formState, merchant: e.target.value })}
                    placeholder="e.g. Uber / Swiggy / BlueDart"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formState.transactionDate}
                    onChange={(e) => setFormState({ ...formState, transactionDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEWING CLAIM DETAILS MODAL */}
      {viewingClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 space-y-4 my-auto shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {viewingClaim.claimNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {viewingClaim.employeeName}
                </h3>
              </div>
              <button
                onClick={() => setViewingClaim(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Claim Amount</span>
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                    ₹{viewingClaim.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {renderStatusBadge(viewingClaim.status)}
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{viewingClaim.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Transaction Date</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewingClaim.transactionDate || viewingClaim.appliedOn || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Merchant</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{viewingClaim.merchant || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Bucket</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{viewingClaim.bucket || 'Internal'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Purpose / Description</span>
                <p className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {viewingClaim.purpose || 'Official Business Expense'}
                </p>
              </div>

              {/* Action for approving/rejecting from modal */}
              {(viewingClaim.status === 'PENDING' || viewingClaim.status === 'SUBMITTED' || viewingClaim.status === 'APPROVED_BY_MANAGER') && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      handleUpdateStatus(viewingClaim.id, 'REJECTED');
                      setViewingClaim(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(viewingClaim.id, 'APPROVED');
                      setViewingClaim(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Approve Claim
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS POPUP MODAL */}
      {commentsModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 space-y-4 my-auto shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Comments — {commentsModalClaim.claimNumber}</span>
              </h3>
              <button
                onClick={() => setCommentsModalClaim(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 text-xs pr-1">
              {(!commentsModalClaim.commentsList || commentsModalClaim.commentsList.length === 0) ? (
                <p className="text-slate-400 text-center py-6 italic">No comments posted yet.</p>
              ) : (
                commentsModalClaim.commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-slate-700 dark:text-slate-300"
                  >
                    <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                      <span>{c.authorName}</span>
                      <span className="text-slate-400 font-normal">{c.timestamp}</span>
                    </div>
                    <p>{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
