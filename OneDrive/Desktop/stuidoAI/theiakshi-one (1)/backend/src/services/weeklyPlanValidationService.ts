import { AttendanceRepository, AttendanceRecord } from '../repositories/attendanceRepository';
import { LeaveRepository, LeaveRequest } from '../repositories/leaveRepository';
import { EmployeeRepository } from '../repositories/employeeRepository';
import { LeaveBalanceRepository, LeaveBalanceTransaction } from '../repositories/leaveBalanceRepository';

export interface WeeklyPlanItem {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  task: string;
  remarks?: string;
  project?: string;
  status?: string;
}

export class WeeklyPlanValidationService {
  private attendanceRepo = new AttendanceRepository();
  private leaveRepo = new LeaveRepository();
  private employeeRepo = new EmployeeRepository();
  private leaveBalanceRepo = new LeaveBalanceRepository();

  /**
   * Daily Validation Check against Weekly Plans.
   * Scans weekly plans for dates/tasks marked as 'leave' (or containing leave keywords).
   * Performs a transactional check against the Employee leave balance table to ensure accurate decrementation:
   * 1. Transactionally verifies available leave balance for requested type.
   * 2. Decrements balance (or converts to UNPAID if zero paid leave remains) & logs transactional record.
   * 3. Inserts an entry into the Attendance table with status 'ON_LEAVE'.
   * 4. Registers an approved Leave Request reflecting the exact decremented leave category.
   */
  async validateWeeklyPlansAndDeductLeaves(plans: WeeklyPlanItem[], targetDate?: string) {
    const today = targetDate || new Date().toISOString().slice(0, 10);
    const employees = await this.employeeRepo.findAll();
    const allLeaves = await this.leaveRepo.findAll();
    const allAttendance = await this.attendanceRepo.getHistory();

    const insertedAttendance: AttendanceRecord[] = [];
    const deductedLeaves: LeaveRequest[] = [];
    const transactions: LeaveBalanceTransaction[] = [];

    // Filter plans for the target date if specified, otherwise scan all supplied plans
    const plansToCheck = plans.filter((p) => {
      if (!p) return false;
      const planDate = p.date ? String(p.date).slice(0, 10) : today;
      return targetDate ? planDate === targetDate : true;
    });

    for (const plan of plansToCheck) {
      const textToScan = `${plan.task || ''} ${plan.remarks || ''} ${plan.project || ''}`.toLowerCase();
      const isLeaveMentioned =
        /\b(leave|casual leave|sick leave|annual leave|earned leave|unpaid leave|lwp|on leave|taking leave|vacation|day off|on_leave)\b/i.test(textToScan) ||
        textToScan.trim() === 'leave' ||
        textToScan.trim() === 'on leave' ||
        textToScan.trim() === 'casual leave' ||
        textToScan.trim() === 'sick leave' ||
        textToScan.trim() === 'l';

      if (!isLeaveMentioned) continue;

      const dateStr = plan.date ? String(plan.date).slice(0, 10) : today;

      // Find target employee
      let emp = employees.find((e) => e.id === plan.employeeId);
      if (!emp && plan.employeeName) {
        const searchName = plan.employeeName.toLowerCase();
        emp = employees.find((e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchName) ||
          e.firstName.toLowerCase().includes(searchName)
        );
      }

      const employeeId = emp ? emp.id : plan.employeeId || 'emp-0a';
      const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : plan.employeeName || 'Employee';
      const department = emp ? emp.department : 'ENGINEERING';

      // 1. Transactional check & decrementation against Employee Leave Balance table
      let initialLeaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' = 'CASUAL';
      if (textToScan.includes('sick')) initialLeaveType = 'SICK';
      else if (textToScan.includes('annual') || textToScan.includes('earned')) initialLeaveType = 'EARNED';
      else if (textToScan.includes('unpaid') || textToScan.includes('lwp')) initialLeaveType = 'UNPAID';

      const decrementResult = await this.leaveBalanceRepo.transactionallyDecrementBalance(
        employeeId,
        initialLeaveType,
        1,
        'CRON_WEEKLY_PLAN_VALIDATION',
        plan.id || dateStr
      );

      transactions.push(decrementResult.transaction);

      // 2. Register/save approved leave request in Leave Repository with exact decremented type
      const existingLeave = allLeaves.find(
        (l) => l.employeeId === employeeId && l.startDate <= dateStr && l.endDate >= dateStr && l.status !== 'REJECTED'
      );

      let leaveReq: LeaveRequest;
      if (!existingLeave) {
        leaveReq = {
          id: `leave-auto-val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          employeeId,
          employeeName,
          department,
          leaveType: decrementResult.finalLeaveType,
          startDate: dateStr,
          endDate: dateStr,
          totalDays: 1,
          reason: `Daily Weekly Plan Validation Check: Leave scheduled on ${dateStr} (${plan.task}). ${decrementResult.transaction.notes || ''}`,
          status: 'APPROVED',
          appliedOn: today,
          approvedBy: 'System Weekly Plan Daily Validator',
        };

        await this.leaveRepo.save(leaveReq);
        allLeaves.unshift(leaveReq);
        deductedLeaves.push(leaveReq);
      } else {
        leaveReq = existingLeave;
      }

      // 3. Automatically insert entry into Attendance table
      const existingAtt = allAttendance.find((a) => a.employeeId === employeeId && a.date === dateStr);
      if (!existingAtt || existingAtt.status !== 'ON_LEAVE') {
        const newAttRecord: AttendanceRecord = {
          id: existingAtt ? existingAtt.id : `att-auto-val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          employeeId,
          employeeName,
          department,
          date: dateStr,
          clockIn: '--:--',
          clockOut: '--:--',
          totalHours: 0,
          status: 'ON_LEAVE',
          locationIn: `Weekly Plan Leave Check (${decrementResult.finalLeaveType} - Bal: ${decrementResult.newBalance})`,
          lateMinutes: 0,
          autoLeaveDeducted: true,
        };

        await this.attendanceRepo.save(newAttRecord);
        allAttendance.unshift(newAttRecord);
        insertedAttendance.push(newAttRecord);
      }
    }

    return {
      success: true,
      validatedDate: today,
      processedPlansCount: plansToCheck.length,
      insertedAttendanceRecordsCount: insertedAttendance.length,
      deductedLeaveRequestsCount: deductedLeaves.length,
      insertedAttendanceRecords: insertedAttendance,
      deductedLeaveRequests: deductedLeaves,
      leaveBalanceTransactions: transactions,
    };
  }
}
