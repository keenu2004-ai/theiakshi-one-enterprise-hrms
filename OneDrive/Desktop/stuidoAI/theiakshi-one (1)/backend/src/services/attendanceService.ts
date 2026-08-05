import { AttendanceRepository, AttendanceRecord } from '../repositories/attendanceRepository';
import { calculateAttendanceBusinessRules } from '../utils/businessRules';

const repo = new AttendanceRepository();

export class AttendanceService {
  async clockIn(employeeId: string, employeeName: string, clockInTime: string, location?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await repo.findByEmployeeAndDate(employeeId, today);

    if (existing && existing.clockIn && !existing.clockOut) {
      // Already clocked in for today and not clocked out yet -> return current active clock-in
      return existing;
    }

    const evaluation = calculateAttendanceBusinessRules(clockInTime);

    const record: AttendanceRecord = {
      id: existing?.id || `att-${Date.now()}`,
      employeeId,
      employeeName,
      department: 'ENGINEERING',
      date: today,
      clockIn: clockInTime,
      clockOut: undefined,
      totalHours: evaluation.totalHours,
      status: evaluation.status,
      locationIn: location || 'GPS Validated Office',
      lateMinutes: evaluation.lateMinutes,
      autoLeaveDeducted: evaluation.autoLeaveDeducted,
    };

    return repo.save(record);
  }

  async clockOut(employeeId: string, clockOutTime: string, location?: string, employeeName?: string) {
    const today = new Date().toISOString().slice(0, 10);
    let existing = await repo.findByEmployeeAndDate(employeeId, today);

    if (!existing || !existing.clockIn) {
      // Auto-create a clock-in record at 09:00 AM if none exists before clocking out
      existing = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName: employeeName || 'Employee',
        department: 'ENGINEERING',
        date: today,
        clockIn: '09:00',
        totalHours: 8.5,
        status: 'PRESENT',
        locationIn: location || 'GPS Validated Office',
        lateMinutes: 0,
        autoLeaveDeducted: false,
      };
    }

    const clockInMins = this.parseTimeMins(existing.clockIn || '09:00');
    const clockOutMins = this.parseTimeMins(clockOutTime);
    const totalHours = Math.max(0, Number(((clockOutMins - clockInMins) / 60).toFixed(2)));

    const updatedRecord: AttendanceRecord = {
      ...existing,
      clockOut: clockOutTime,
      totalHours: totalHours || 8.5,
      locationOut: location || 'GPS Validated Office',
    };

    return repo.save(updatedRecord);
  }

  async getAttendanceHistory(employeeId?: string) {
    return repo.getHistory(employeeId);
  }

  async getAllRecords() {
    return repo.getHistory();
  }

  async regularizeAttendance(recordId: string, _reason: string) {
    const records = await repo.getHistory();
    const target = records.find((r) => r.id === recordId);
    if (!target) throw new Error('Attendance record not found');

    target.status = 'PRESENT';
    target.autoLeaveDeducted = false;
    return repo.save(target);
  }

  private parseTimeMins(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  }
}
