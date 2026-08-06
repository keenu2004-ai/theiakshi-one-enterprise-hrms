import { PayrollRepository, Payslip } from '../repositories/payrollRepository';
import { EmployeeRepository } from '../repositories/employeeRepository';

const payrollRepo = new PayrollRepository();
const employeeRepo = new EmployeeRepository();

export class PayrollService {
  async getAllPayslips() {
    return payrollRepo.findAll();
  }

  async generateMonthlyPayroll(payPeriod: string) {
    const employees = await employeeRepo.findAll();
    const generatedSlips: Payslip[] = [];

    for (const emp of employees) {
      const gross = emp.salary.grossSalary || 100000;
      const deductions = (emp.salary.pfEmployee || 1800) + (emp.salary.tdsTax || 5000);
      const net = gross - deductions;

      const slip: Payslip = {
        id: `pay-${payPeriod.toLowerCase().replace(/\s+/g, '-')}-${emp.id}`,
        payslipNumber: `SLIP-${payPeriod.replace(/\s+/g, '')}-${emp.code}`,
        payPeriod,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.code,
        designation: emp.designation,
        department: emp.department,
        grossEarnings: gross,
        totalDeductions: deductions,
        netSalary: net,
        status: 'PAID',
        generatedDate: new Date().toISOString().slice(0, 10),
      };

      await payrollRepo.save(slip);
      generatedSlips.push(slip);
    }

    return generatedSlips;
  }
}
