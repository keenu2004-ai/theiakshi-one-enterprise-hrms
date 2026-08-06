import { ExpenseRepository, ExpenseClaim } from '../repositories/expenseRepository';

const repo = new ExpenseRepository();

export class ExpenseService {
  async getAllClaims() {
    return repo.findAll();
  }

  async submitClaim(data: {
    employeeId: string;
    employeeName: string;
    category: string;
    amount: number;
    purpose: string;
    receiptUrl?: string;
  }) {
    const claim: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      claimNumber: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      category: data.category,
      amount: data.amount,
      purpose: data.purpose,
      status: 'SUBMITTED',
      date: new Date().toISOString().slice(0, 10),
      receiptUrl: data.receiptUrl,
    };

    return repo.save(claim);
  }

  async approveClaim(id: string) {
    const claims = await repo.findAll();
    const target = claims.find((c) => c.id === id);
    if (!target) throw new Error('Claim not found');

    target.status = 'APPROVED';
    return repo.save(target);
  }
}
