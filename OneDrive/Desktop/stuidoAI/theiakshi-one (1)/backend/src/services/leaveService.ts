import { LeaveRepository, LeaveRequest } from '../repositories/leaveRepository';
import { LeaveBalanceRepository } from '../repositories/leaveBalanceRepository';
import { calculateMonthlyCasualLeaveToLop } from '../utils/businessRules';

const repo = new LeaveRepository();
const balanceRepo = new LeaveBalanceRepository();

export class LeaveService {
  async getAllLeaves() {
    return repo.findAll();
  }

  async applyLeave(data: {
    employeeId: string;
    employeeName: string;
    department: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Apply monthly casual leave to LOP conversion rule
    let effectiveLeaveType = data.leaveType;
    if (data.leaveType === 'CASUAL') {
      const monthLeaves = await repo.findAll();
      const existingCasualThisMonth = monthLeaves.filter(
        (l) => l.employeeId === data.employeeId && l.leaveType === 'CASUAL' && l.status === 'APPROVED'
      ).length;

      const rule = calculateMonthlyCasualLeaveToLop(existingCasualThisMonth + totalDays, 2);
      if (rule.convertedToLop > 0) {
        effectiveLeaveType = 'UNPAID / LOP (Auto-converted from Casual Leave limit)';
      }
    }

    const leave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      department: data.department,
      leaveType: effectiveLeaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays,
      reason: data.reason,
      status: 'PENDING',
      appliedOn: new Date().toISOString().slice(0, 10),
    };

    return repo.save(leave);
  }

  async approveLeave(leaveId: string, approvedBy: string) {
    const leaves = await repo.findAll();
    const target = leaves.find((l) => l.id === leaveId);
    if (!target) throw new Error('Leave request not found');

    target.status = 'APPROVED';
    target.approvedBy = approvedBy;

    // Also update leave balance transactionally upon approval
    let typeKey: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' = 'CASUAL';
    if (target.leaveType.includes('SICK')) typeKey = 'SICK';
    else if (target.leaveType.includes('EARNED') || target.leaveType.includes('ANNUAL')) typeKey = 'EARNED';
    else if (target.leaveType.includes('UNPAID') || target.leaveType.includes('LOP')) typeKey = 'UNPAID';

    await balanceRepo.transactionallyDecrementBalance(
      target.employeeId,
      typeKey,
      target.totalDays || 1,
      'MANUAL_LEAVE_APPROVAL',
      leaveId
    );

    return repo.save(target);
  }

  async rejectLeave(leaveId: string, reason: string) {
    const leaves = await repo.findAll();
    const target = leaves.find((l) => l.id === leaveId);
    if (!target) throw new Error('Leave request not found');

    target.status = 'REJECTED';
    target.rejectionReason = reason;
    return repo.save(target);
  }

  async getLeaveLedger(employeeId: string) {
    const bal = await balanceRepo.getBalance(employeeId);

    const casualRem = Math.max(0, bal.casualAllocated - bal.casualUsed);
    const sickRem = Math.max(0, bal.sickAllocated - bal.sickUsed);
    const earnedRem = Math.max(0, bal.earnedAllocated - bal.earnedUsed);

    return {
      employeeId,
      casual: { total: bal.casualAllocated, used: bal.casualUsed, remaining: casualRem },
      sick: { total: bal.sickAllocated, used: bal.sickUsed, remaining: sickRem },
      earned: { total: bal.earnedAllocated, used: bal.earnedUsed, remaining: earnedRem },
      unpaidLop: { total: bal.unpaidAllocated, used: bal.unpaidUsed, remaining: 0 },
      lastUpdated: bal.updatedAt,
    };
  }

  async getLeaveBalanceTransactions(employeeId?: string) {
    return balanceRepo.getTransactions(employeeId);
  }
}
