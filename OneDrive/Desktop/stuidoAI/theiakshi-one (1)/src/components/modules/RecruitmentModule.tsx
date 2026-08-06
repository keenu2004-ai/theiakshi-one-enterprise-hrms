import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Plus,
  Star,
  Calendar,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles,
  FileText,
  Building2,
} from 'lucide-react';
import { JobPosting, Candidate } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const RecruitmentModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast, openCopilotWithPrompt } = useNotification();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'jobs'>('pipeline');

  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('ENGINEERING');

  const loadRecruitmentData = () => {
    fetch('/api/v1/recruitment/jobs')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      });

    fetch('/api/v1/recruitment/candidates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
      });
  };

  useEffect(() => {
    loadRecruitmentData();
  }, []);

  const handleMoveCandidateStage = (candidateId: string, nextStage: Candidate['stage']) => {
    fetch(`/api/v1/recruitment/candidates/${candidateId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage }),
    })
      .then((r) => r.json())
      .then((updated) => {
        showToast('Candidate Updated', `Moved ${updated.name} to ${nextStage} stage`, 'SUCCESS');
        loadRecruitmentData();
      });
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle) return;

    fetch('/api/v1/recruitment/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newJobTitle,
        department: newJobDept,
        location: 'Bengaluru / Hybrid',
        type: 'FULL_TIME',
        experienceYears: '3 - 6 Years',
        salaryRange: '₹18,000,000 - ₹28,000,000 P.A.',
        description: 'New position open for THEIAKSHI ONE team.',
        requirements: ['Core Domain Mastery', 'Communication Skills'],
      }),
    })
      .then((r) => r.json())
      .then((created) => {
        showToast('Requisition Published', `Created job posting for ${created.title}`, 'SUCCESS');
        setIsNewJobModalOpen(false);
        setNewJobTitle('');
        loadRecruitmentData();
      });
  };

  const pipelineStages: Candidate['stage'][] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recruitment & ATS Pipeline</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Job requisitions, applicant tracking system (ATS), interview scheduling, and AI offer letter generator.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsNewJobModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Create Job Requisition</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'pipeline' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
          }`}
        >
          Candidate Kanban Pipeline
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
          }`}
        >
          Open Job Requisitions ({jobs.length})
        </button>
      </div>

      {/* Kanban Board View */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.stage === stage);
            return (
              <div
                key={stage}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/60 min-h-[400px] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 dark:border-slate-800">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {stage}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2 hover:border-blue-400 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{cand.name}</span>
                        <div className="flex items-center text-amber-500 text-[10px] font-bold">
                          <Star className="h-3 w-3 fill-amber-500" /> {cand.rating}
                        </div>
                      </div>

                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{cand.jobTitle}</div>
                      <div className="text-[10px] text-slate-400">{cand.experienceYears} Yrs Exp • {cand.email}</div>

                      {cand.interviewDate && (
                        <div className="text-[10px] bg-indigo-50 text-indigo-700 p-1.5 rounded-lg dark:bg-indigo-950/60 dark:text-indigo-300">
                          Interview: {cand.interviewDate}
                        </div>
                      )}

                      {/* Stage transition controls */}
                      <div className="pt-2 flex justify-between gap-1 border-t border-slate-100 dark:border-slate-800">
                        {stage !== 'OFFER' && stage !== 'HIRED' && (
                          <button
                            onClick={() => {
                              const nextIdx = pipelineStages.indexOf(stage) + 1;
                              if (nextIdx < pipelineStages.length) {
                                handleMoveCandidateStage(cand.id, pipelineStages[nextIdx]);
                              }
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            Advance <ChevronRight className="h-3 w-3" />
                          </button>
                        )}

                        {stage === 'OFFER' && (
                          <button
                            onClick={() =>
                              openCopilotWithPrompt(
                                `Draft a formal employment offer letter for ${cand.name} for the position of ${cand.jobTitle} with CTC ₹28,000,000.`
                              )
                            }
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                          >
                            <Sparkles className="h-3 w-3" /> Draft Offer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jobs List View */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400">{job.jobCode}</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{job.title}</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {job.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2">{job.description}</p>

              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{job.salaryRange}</div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t dark:border-slate-800">
                <span>{job.department}</span>
                <span className="font-bold text-blue-600">{job.applicantsCount} Applicants</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Requisition Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create Job Requisition</h3>
              <button onClick={() => setIsNewJobModalOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Senior Security Engineer"
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <select
                  value={newJobDept}
                  onChange={(e) => setNewJobDept(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                >
                  <option value="ENGINEERING">Engineering</option>
                  <option value="HUMAN_RESOURCES">Human Resources</option>
                  <option value="FINANCE">Finance</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="DESIGN">Design</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setIsNewJobModalOpen(false)} className="rounded-xl border px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white">
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
