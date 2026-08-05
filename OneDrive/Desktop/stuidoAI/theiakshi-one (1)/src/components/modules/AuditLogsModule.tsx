import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { AuditLog } from '../../types';

export const AuditLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch('/api/v1/audit-logs')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      });
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Zero-Trust System Audit Logs</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Real-time security trail, policy updates, role mutations, IP addresses, and operational events.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">User & Role</th>
              <th className="p-3.5">Action & Module</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">IP Address</th>
              <th className="p-3.5">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((lg) => (
              <tr key={lg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                <td className="p-3.5 font-mono text-slate-500">{lg.timestamp}</td>
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                  {lg.userName}
                  <div className="text-[10px] text-slate-400 font-normal">{lg.role}</div>
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">{lg.action}</div>
                  <div className="text-[10px] text-slate-400">{lg.module}</div>
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-sm">{lg.description}</td>
                <td className="p-3.5 font-mono text-slate-500">{lg.ipAddress}</td>
                <td className="p-3.5">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {lg.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
