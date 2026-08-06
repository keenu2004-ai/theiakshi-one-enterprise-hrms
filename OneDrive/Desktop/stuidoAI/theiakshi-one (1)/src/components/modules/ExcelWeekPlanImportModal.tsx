import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNotification } from '../../context/NotificationContext';
import { WeeklyTask } from '../../types';

interface ExcelWeekPlanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const ExcelWeekPlanImportModal: React.FC<ExcelWeekPlanImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { showToast } = useNotification();

  const [parsedData, setParsedData] = useState<Partial<WeeklyTask>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generate Sample Excel Sheet
  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        'Employee ID': 'emp-4',
        'Employee Name': 'Ananya Rao',
        Date: new Date().toISOString().substring(0, 10),
        'Task Description': 'Finalize Figma design tokens for Mobile HRMS view',
        Priority: 'HIGH',
        Department: 'PRODUCT',
        Project: 'PRJ-AURA',
        Deadline: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
        Remarks: 'Audit responsive view on Android screen sizes',
      },
      {
        'Employee ID': 'emp-1',
        'Employee Name': 'Arjun Sharma',
        Date: new Date().toISOString().substring(0, 10),
        'Task Description': 'Database indexing and Redis caching optimization',
        Priority: 'URGENT',
        Department: 'ENGINEERING',
        Project: 'PRJ-NEBULA',
        Deadline: new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10),
        Remarks: 'Targeting <50ms query response time across 500+ employees',
      },
      {
        'Employee ID': 'emp-0a',
        'Employee Name': 'Vaibhav Rajput',
        Date: new Date().toISOString().substring(0, 10),
        'Task Description': 'Review Q3 Executive HR Strategy & Multi-Branch Expansion',
        Priority: 'HIGH',
        Department: 'EXECUTIVE',
        Project: 'PRJ-NEBULA',
        Deadline: new Date(Date.now() + 86400000 * 5).toISOString().substring(0, 10),
        Remarks: 'Prepare townhall presentation slides',
      },
      {
        'Employee ID': 'emp-4',
        'Employee Name': 'Ananya Rao',
        Date: new Date().toISOString().substring(0, 10),
        'Task Description': 'On Leave (Casual Leave - Pre-Approved Plan)',
        Priority: 'MEDIUM',
        Department: 'PRODUCT',
        Project: 'PRJ-AURA',
        Deadline: new Date().toISOString().substring(0, 10),
        Remarks: 'Leave automatically deducted from leave session & marked On Leave in attendance',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly_Tasks_Plan');

    XLSX.writeFile(workbook, 'THEIAKSHI_Weekly_Plan_Template.xlsx');
    showToast(
      'Template Downloaded',
      'Downloaded pre-formatted Excel template for weekly task planning.',
      'SUCCESS'
    );
  };

  // Read Uploaded Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonRows.length === 0) {
          showToast('Empty Sheet', 'No data rows found in the uploaded Excel file.', 'WARNING');
          setIsProcessing(false);
          return;
        }

        const mappedTasks: Partial<WeeklyTask>[] = jsonRows.map((row) => ({
          employeeId: row['Employee ID'] || row['employeeId'] || 'emp-4',
          employeeName: row['Employee Name'] || row['employeeName'] || 'Assigned Employee',
          date: row['Date'] || row['date'] || new Date().toISOString().substring(0, 10),
          task: row['Task Description'] || row['task'] || row['Task'] || 'Weekly Planned Task',
          priority: (row['Priority'] || row['priority'] || 'MEDIUM').toString().toUpperCase() as any,
          department: row['Department'] || row['department'] || 'ENGINEERING',
          project: row['Project'] || row['project'] || 'General Operations',
          deadline: row['Deadline'] || row['deadline'] || new Date().toISOString().substring(0, 10),
          remarks: row['Remarks'] || row['remarks'] || 'Imported via Weekly Plan Excel Sheet',
        }));

        setParsedData(mappedTasks);
        showToast(
          'Excel Parsed',
          `Successfully loaded ${mappedTasks.length} task records from ${file.name}`,
          'SUCCESS'
        );
      } catch (err) {
        console.error('Excel Parsing Error:', err);
        showToast('Import Error', 'Failed to parse Excel file. Please use the valid template.', 'ERROR');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit Parsed Tasks to Backend API
  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    fetch('/api/v1/tasks/import-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: parsedData }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.autoLeaveDeductedCount && data.autoLeaveDeductedCount > 0) {
          showToast(
            'Import & Auto-Leave Complete',
            `Assigned ${data.importedCount || parsedData.length} weekly tasks. ${data.autoLeaveDeductedCount} leave(s) automatically detected and deducted from leave session! Attendance status updated to ON_LEAVE.`,
            'SUCCESS'
          );
        } else {
          showToast(
            'Import Complete',
            `Successfully assigned ${data.importedCount || parsedData.length} weekly tasks!`,
            'SUCCESS'
          );
        }
        if (onImportSuccess) onImportSuccess();
        onClose();
      })
      .catch((err) => {
        console.error('Error importing tasks:', err);
        showToast('Import Failed', 'Could not upload tasks to server.', 'ERROR');
      })
      .finally(() => setIsUploading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Excel Week Plan Importer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload manager weekly plans and auto-assign employee tasks
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Step 1: Download Sample Sheet */}
          <div className="flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Step 1: Download Weekly Plan Format
                </h4>
                <p className="text-[11px] text-slate-500">
                  Get pre-formatted Excel template with employee columns & priorities.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadSampleTemplate}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Sample Template (.xlsx)
            </button>
          </div>

          {/* Step 2: Upload Excel File */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Step 2: Upload Completed Excel Sheet
            </h4>
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30">
              <Upload className="w-8 h-8 text-blue-500 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {fileName ? fileName : 'Click or Drag & Drop Excel (.xlsx / .xls) file'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: Microsoft Excel Spreadsheet (.xlsx, .xls)
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Step 3: Preview Data */}
          {isProcessing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Parsing Excel task records...</p>
            </div>
          ) : parsedData.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Parsed Preview (
                  {parsedData.length} Tasks)
                </h4>
                <span className="text-[11px] text-blue-600 font-semibold">
                  Ready to assign to employees
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-48">
                <table className="w-full text-left text-[11px] text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px] text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-2.5">Employee</th>
                      <th className="p-2.5">Task Description</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {parsedData.map((task, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                          {task.employeeName}
                        </td>
                        <td className="p-2.5 max-w-xs truncate">{task.task}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                              task.priority === 'URGENT'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-blue-500/10 text-blue-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="p-2.5">{task.department}</td>
                        <td className="p-2.5 font-semibold">{task.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedData.length === 0 || isUploading}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            {isUploading ? (
              'Processing Import...'
            ) : (
              <>
                Confirm & Import {parsedData.length} Tasks <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
