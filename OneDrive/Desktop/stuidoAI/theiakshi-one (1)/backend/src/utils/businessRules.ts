export interface AttendanceCalculationResult {
  status: 'PRESENT' | 'LATE' | 'SHORT_LEAVE' | 'HALF_DAY' | 'ABSENT';
  lateMinutes: number;
  totalHours: number;
  isShortLeave: boolean;
  isHalfDay: boolean;
  autoLeaveDeducted: boolean;
  ruleReason: string;
}

export function calculateAttendanceBusinessRules(
  clockInTime: string, // e.g. "09:15"
  clockOutTime?: string, // e.g. "18:00"
  shiftStartTime = '09:00',
  shiftEndTime = '18:00'
): AttendanceCalculationResult {
  const parseTimeMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const inMins = parseTimeMins(clockInTime);
  const shiftStartMins = parseTimeMins(shiftStartTime);
  const shiftEndMins = parseTimeMins(shiftEndTime);

  const lateMinutes = Math.max(0, inMins - shiftStartMins);
  let totalHours = 8.0;

  if (clockOutTime) {
    const outMins = parseTimeMins(clockOutTime);
    totalHours = Math.max(0, Number(((outMins - inMins) / 60).toFixed(2)));
  }

  let status: AttendanceCalculationResult['status'] = 'PRESENT';
  let isShortLeave = false;
  let isHalfDay = false;
  let autoLeaveDeducted = false;
  let ruleReason = 'Normal clock in';

  if (lateMinutes > 180) {
    // Late > 3 Hours -> Half Day
    status = 'HALF_DAY';
    isHalfDay = true;
    autoLeaveDeducted = true;
    ruleReason = `Late arrival by ${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m exceeds 3-hour limit; converted to Half Day (0.5 leave).`;
  } else if (lateMinutes > 120) {
    // Late > 2 Hours -> Short Leave
    status = 'SHORT_LEAVE';
    isShortLeave = true;
    ruleReason = `Late arrival by ${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m exceeds 2-hour limit; logged as Short Leave.`;
  } else if (lateMinutes > 15) {
    status = 'LATE';
    ruleReason = `Late arrival by ${lateMinutes} minutes beyond 15-minute grace period.`;
  }

  return {
    status,
    lateMinutes,
    totalHours,
    isShortLeave,
    isHalfDay,
    autoLeaveDeducted,
    ruleReason,
  };
}

export function calculateMonthlyCasualLeaveToLop(
  casualLeavesRequestedInMonth: number,
  maxAllowedCasualPerMonth = 2
) {
  const allowedCasual = Math.min(casualLeavesRequestedInMonth, maxAllowedCasualPerMonth);
  const convertedToLop = Math.max(0, casualLeavesRequestedInMonth - maxAllowedCasualPerMonth);
  return {
    allowedCasual,
    convertedToLop,
    salaryDeductionApplies: convertedToLop > 0,
  };
}
