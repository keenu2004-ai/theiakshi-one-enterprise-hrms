import { executeQuery } from '../database/db';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedOn: string;
  approvedBy?: string;
  rejectionReason?: string;
}

let mockLeaves: LeaveRequest[] = [
  {
    id: 'leave-101',
    employeeId: 'emp-0a',
    employeeName: 'Vaibhav Rajput',
    department: 'EXECUTIVE',
    leaveType: 'CASUAL',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    totalDays: 2,
    reason: 'Family event and rest',
    status: 'APPROVED',
    appliedOn: '2026-08-01',
    approvedBy: 'Auto System',
  },
];

export class LeaveRepository {
  async findAll(): Promise<LeaveRequest[]> {
    try {
      const rows = await executeQuery('SELECT * FROM leave_requests ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        const sqlLeaves: LeaveRequest[] = rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          department: r.department || 'GENERAL',
          leaveType: r.type,
          startDate: String(r.start_date).slice(0, 10),
          endDate: String(r.end_date).slice(0, 10),
          totalDays: Number(r.days_count || 1),
          reason: r.reason,
          status: r.status || 'PENDING',
          appliedOn: r.applied_on ? String(r.applied_on).slice(0, 10) : '2026-08-01',
          approvedBy: r.approved_by,
          rejectionReason: r.rejection_reason,
        }));
        const map = new Map<string, LeaveRequest>();
        mockLeaves.forEach((l) => map.set(l.id, l));
        sqlLeaves.forEach((l) => map.set(l.id, l));
        return Array.from(map.values());
      }
    } catch (e) {}

    return mockLeaves;
  }

  async save(leave: LeaveRequest): Promise<LeaveRequest> {
    if (!leave.id) leave.id = `leave-${Date.now()}`;
    const idx = mockLeaves.findIndex((l) => l.id === leave.id);
    if (idx >= 0) mockLeaves[idx] = leave;
    else mockLeaves.push(leave);

    try {
      await executeQuery(
        `INSERT INTO leave_requests (id, employee_id, employee_name, department, type, start_date, end_date, days_count, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [
          leave.id,
          leave.employeeId,
          leave.employeeName,
          leave.department,
          leave.leaveType,
          leave.startDate,
          leave.endDate,
          leave.totalDays,
          leave.reason,
          leave.status,
        ]
      );
    } catch (e) {}

    return leave;
  }
}
