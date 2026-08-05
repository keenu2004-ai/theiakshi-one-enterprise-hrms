import { executeQuery } from '../database/db';

export interface Payslip {
  id: string;
  payslipNumber: string;
  payPeriod: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  generatedDate: string;
}

let mockPayslips: Payslip[] = [
  {
    id: 'pay-2026-07-emp0a',
    payslipNumber: 'SLIP-2026-07-001',
    payPeriod: 'July 2026',
    employeeId: 'emp-0a',
    employeeName: 'Vaibhav Rajput',
    employeeCode: 'TOK-1000',
    designation: 'Managing Director & CEO',
    department: 'EXECUTIVE',
    grossEarnings: 260000,
    totalDeductions: 48000,
    netSalary: 212000,
    status: 'PAID',
    generatedDate: '2026-07-31',
  },
];

export class PayrollRepository {
  async findAll(): Promise<Payslip[]> {
    try {
      const rows = await executeQuery('SELECT * FROM payslips ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          payslipNumber: r.id,
          payPeriod: r.pay_period || 'July 2026',
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          employeeCode: r.employee_code || 'EMP',
          designation: 'Executive',
          department: 'GENERAL',
          grossEarnings: Number(r.gross_earnings || 0),
          totalDeductions: Number(r.total_deductions || 0),
          netSalary: Number(r.net_pay || 0),
          status: r.status || 'PAID',
          generatedDate: String(r.created_at).slice(0, 10),
        }));
      }
    } catch (e) {}
    return mockPayslips;
  }

  async save(slip: Payslip): Promise<Payslip> {
    const idx = mockPayslips.findIndex((p) => p.id === slip.id);
    if (idx >= 0) mockPayslips[idx] = slip;
    else mockPayslips.push(slip);

    try {
      await executeQuery(
        `INSERT INTO payslips (id, employee_id, employee_name, month, pay_period, basic_pay, hra, gross_earnings, total_deductions, net_pay, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [
          slip.id,
          slip.employeeId,
          slip.employeeName,
          slip.payPeriod,
          slip.payPeriod,
          slip.grossEarnings * 0.5,
          slip.grossEarnings * 0.3,
          slip.grossEarnings,
          slip.totalDeductions,
          slip.netSalary,
          slip.status,
        ]
      );
    } catch (e) {}

    return slip;
  }
}
