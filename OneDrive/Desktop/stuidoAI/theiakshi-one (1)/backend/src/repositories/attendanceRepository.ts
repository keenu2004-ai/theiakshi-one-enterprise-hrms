import { executeQuery } from '../database/db';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: string;
  locationIn?: string;
  locationOut?: string;
  lateMinutes: number;
  autoLeaveDeducted: boolean;
}

let mockAttendance: AttendanceRecord[] = [
  {
    id: 'att-101',
    employeeId: 'emp-0a',
    employeeName: 'Vaibhav Rajput',
    department: 'EXECUTIVE',
    date: new Date().toISOString().slice(0, 10),
    clockIn: '09:05',
    clockOut: '18:15',
    totalHours: 9.1,
    status: 'PRESENT',
    locationIn: 'Headquarters Bengaluru (GPS Validated)',
    lateMinutes: 5,
    autoLeaveDeducted: false,
  },
  {
    id: 'att-102',
    employeeId: 'emp-0b',
    employeeName: 'Vaibhav Arya',
    department: 'EXECUTIVE',
    date: new Date().toISOString().slice(0, 10),
    clockIn: '09:10',
    clockOut: '18:10',
    totalHours: 9.0,
    status: 'PRESENT',
    locationIn: 'Headquarters Bengaluru (GPS Validated)',
    lateMinutes: 10,
    autoLeaveDeducted: false,
  },
];

export class AttendanceRepository {
  async findByEmployeeAndDate(employeeId: string, date: string): Promise<AttendanceRecord | null> {
    try {
      const rows = await executeQuery(
        'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
        [employeeId, date]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          department: r.department || 'ENGINEERING',
          date: String(r.date).slice(0, 10),
          clockIn: r.clock_in,
          clockOut: r.clock_out,
          totalHours: Number(r.total_hours || 0),
          status: r.status,
          locationIn: r.clock_in_location,
          lateMinutes: 0,
          autoLeaveDeducted: false,
        };
      }
    } catch (e) {}

    return mockAttendance.find((a) => a.employeeId === employeeId && a.date === date) || null;
  }

  async save(record: AttendanceRecord): Promise<AttendanceRecord> {
    const idx = mockAttendance.findIndex((a) => a.id === record.id);
    if (idx >= 0) mockAttendance[idx] = record;
    else mockAttendance.push(record);

    try {
      await executeQuery(
        `INSERT INTO attendance_records (id, employee_id, employee_name, date, clock_in, clock_out, total_hours, status, clock_in_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           clock_out = EXCLUDED.clock_out,
           total_hours = EXCLUDED.total_hours,
           status = EXCLUDED.status`,
        [
          record.id,
          record.employeeId,
          record.employeeName,
          record.date,
          record.clockIn || null,
          record.clockOut || null,
          record.totalHours,
          record.status,
          record.locationIn || 'Office',
        ]
      );
    } catch (e) {}

    return record;
  }

  async getHistory(employeeId?: string): Promise<AttendanceRecord[]> {
    if (employeeId) {
      return mockAttendance.filter((a) => a.employeeId === employeeId);
    }
    return mockAttendance;
  }
}
