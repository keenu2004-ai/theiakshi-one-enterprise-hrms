import { AttendanceRepository } from '../../repositories/attendanceRepository';
import { WeeklyPlanValidationService } from '../../services/weeklyPlanValidationService';

export function initializeAttendanceCronJob() {
  console.log('[CRON] Initializing Attendance, Weekly Plan Validation & LOP Conversion Cron Job...');

  const validator = new WeeklyPlanValidationService();

  // Periodic check every hour for clock-out compliance and daily weekly plan validation
  setInterval(async () => {
    try {
      const repo = new AttendanceRepository();
      const history = await repo.getHistory();
      const today = new Date().toISOString().slice(0, 10);

      // Run daily validation check against weekly plans
      try {
        // Fetch tasks if available via server API or local store
        const res = await fetch('http://localhost:3000/api/v1/tasks').then((r) => r.json()).catch(() => []);
        if (Array.isArray(res) && res.length > 0) {
          const valResult = await validator.validateWeeklyPlansAndDeductLeaves(res, today);
          if (valResult.insertedAttendanceRecordsCount > 0) {
            console.log(`[CRON Daily Weekly Plan Check] Auto-inserted ${valResult.insertedAttendanceRecordsCount} ON_LEAVE attendance records and deducted ${valResult.deductedLeaveRequestsCount} leave(s).`);
          }
        }
      } catch (err) {
        console.error('[CRON Weekly Plan Validation Error]', err);
      }

      for (const record of history) {
        if (record.date === today && record.clockIn && !record.clockOut) {
          // Late night auto clock out rule
          const currentHour = new Date().getHours();
          if (currentHour >= 22) {
            record.clockOut = '20:00';
            record.totalHours = 9.0;
            await repo.save(record);
            console.log(`[CRON] Auto clocked out employee ${record.employeeName} for ${today}`);
          }
        }
      }
    } catch (err) {
      console.error('[CRON Error]', err);
    }
  }, 60 * 60 * 1000);
}
