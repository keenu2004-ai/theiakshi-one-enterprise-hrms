import { executeQuery } from '../database/db';

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  purpose: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  date: string;
  receiptUrl?: string;
}

let mockExpenses: ExpenseClaim[] = [
  {
    id: 'exp-101',
    claimNumber: 'EXP-2026-001',
    employeeId: 'emp-0a',
    employeeName: 'Vaibhav Rajput',
    category: 'Outstation Travel',
    amount: 14500,
    purpose: 'Executive Board Meeting in Delhi Hub',
    status: 'APPROVED',
    date: '2026-07-28',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300',
  },
];

export class ExpenseRepository {
  async findAll(): Promise<ExpenseClaim[]> {
    try {
      const rows = await executeQuery('SELECT * FROM expense_claims ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        const sqlExpenses: ExpenseClaim[] = rows.map((r) => ({
          id: r.id,
          claimNumber: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          category: r.category,
          amount: Number(r.amount || 0),
          purpose: r.description,
          status: r.status || 'SUBMITTED',
          date: String(r.date).slice(0, 10),
          receiptUrl: r.receipt_url,
        }));
        const map = new Map<string, ExpenseClaim>();
        mockExpenses.forEach((e) => map.set(e.id, e));
        sqlExpenses.forEach((e) => map.set(e.id, e));
        return Array.from(map.values());
      }
    } catch (e) {}
    return mockExpenses;
  }

  async save(claim: ExpenseClaim): Promise<ExpenseClaim> {
    if (!claim.id) claim.id = `exp-${Date.now()}`;
    if (!claim.claimNumber) claim.claimNumber = `EXP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const idx = mockExpenses.findIndex((e) => e.id === claim.id);
    if (idx >= 0) mockExpenses[idx] = claim;
    else mockExpenses.push(claim);

    try {
      await executeQuery(
        `INSERT INTO expense_claims (id, employee_id, employee_name, category, amount, date, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [
          claim.id,
          claim.employeeId,
          claim.employeeName,
          claim.category,
          claim.amount,
          claim.date,
          claim.purpose,
          claim.status,
        ]
      );
    } catch (e) {}

    return claim;
  }
}
