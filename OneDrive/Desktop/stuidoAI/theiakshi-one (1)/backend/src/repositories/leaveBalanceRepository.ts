import { executeQuery, dbPool } from '../database/db';

export interface EmployeeLeaveBalance {
  employeeId: string;
  casualAllocated: number;
  casualUsed: number;
  sickAllocated: number;
  sickUsed: number;
  earnedAllocated: number;
  earnedUsed: number;
  unpaidAllocated: number;
  unpaidUsed: number;
  updatedAt: string;
}

export interface LeaveBalanceTransaction {
  id: string;
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';
  requestedDays: number;
  deductedDays: number;
  previousBalance: number;
  newBalance: number;
  source: string;
  referenceId?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FALLBACK_UNPAID' | 'FAILED';
  notes?: string;
}

// In-Memory store for employee leave balances
const mockBalances: Map<string, EmployeeLeaveBalance> = new Map([
  [
    'emp-0a',
    {
      employeeId: 'emp-0a',
      casualAllocated: 12,
      casualUsed: 2,
      sickAllocated: 12,
      sickUsed: 1,
      earnedAllocated: 15,
      earnedUsed: 0,
      unpaidAllocated: 0,
      unpaidUsed: 0,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'emp-0b',
    {
      employeeId: 'emp-0b',
      casualAllocated: 12,
      casualUsed: 0,
      sickAllocated: 12,
      sickUsed: 0,
      earnedAllocated: 15,
      earnedUsed: 0,
      unpaidAllocated: 0,
      unpaidUsed: 0,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'emp-4',
    {
      employeeId: 'emp-4',
      casualAllocated: 12,
      casualUsed: 1,
      sickAllocated: 12,
      sickUsed: 0,
      earnedAllocated: 15,
      earnedUsed: 0,
      unpaidAllocated: 0,
      unpaidUsed: 0,
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const transactionsLog: LeaveBalanceTransaction[] = [];

export class LeaveBalanceRepository {
  /**
   * Retrieves or initializes the leave balance record for a given employee.
   */
  async getBalance(employeeId: string): Promise<EmployeeLeaveBalance> {
    try {
      const rows = await executeQuery(
        'SELECT * FROM employee_leave_balances WHERE employee_id = $1',
        [employeeId]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          employeeId: r.employee_id,
          casualAllocated: Number(r.casual_allocated ?? 12),
          casualUsed: Number(r.casual_used ?? 0),
          sickAllocated: Number(r.sick_allocated ?? 12),
          sickUsed: Number(r.sick_used ?? 0),
          earnedAllocated: Number(r.earned_allocated ?? 15),
          earnedUsed: Number(r.earned_used ?? 0),
          unpaidAllocated: Number(r.unpaid_allocated ?? 0),
          unpaidUsed: Number(r.unpaid_used ?? 0),
          updatedAt: r.updated_at || new Date().toISOString(),
        };
      }
    } catch (e) {
      // Fallback to in-memory store
    }

    if (!mockBalances.has(employeeId)) {
      mockBalances.set(employeeId, {
        employeeId,
        casualAllocated: 12,
        casualUsed: 0,
        sickAllocated: 12,
        sickUsed: 0,
        earnedAllocated: 15,
        earnedUsed: 0,
        unpaidAllocated: 0,
        unpaidUsed: 0,
        updatedAt: new Date().toISOString(),
      });
    }

    return mockBalances.get(employeeId)!;
  }

  /**
   * Executes a transactional check and decrements the leave balance.
   * Checks remaining leave balance for requested type; if insufficient, falls back to available paid types or UNPAID.
   * Accurately decrements balance and records a transaction audit log.
   */
  async transactionallyDecrementBalance(
    employeeId: string,
    requestedType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID',
    daysToDeduct: number = 1,
    source: string = 'WEEKLY_PLAN_CRON_VALIDATION',
    referenceId?: string
  ): Promise<{
    success: boolean;
    finalLeaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';
    previousBalance: number;
    newBalance: number;
    transaction: LeaveBalanceTransaction;
    balance: EmployeeLeaveBalance;
  }> {
    if (dbPool) {
      const client = await dbPool.connect();
      try {
        await client.query('BEGIN');

        // Ensure table exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS employee_leave_balances (
            employee_id VARCHAR(100) PRIMARY KEY,
            casual_allocated INT DEFAULT 12,
            casual_used INT DEFAULT 0,
            sick_allocated INT DEFAULT 12,
            sick_used INT DEFAULT 0,
            earned_allocated INT DEFAULT 15,
            earned_used INT DEFAULT 0,
            unpaid_allocated INT DEFAULT 0,
            unpaid_used INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS leave_balance_transactions (
            id VARCHAR(100) PRIMARY KEY,
            employee_id VARCHAR(100),
            leave_type VARCHAR(50),
            requested_days INT,
            deducted_days INT,
            previous_balance INT,
            new_balance INT,
            source VARCHAR(100),
            reference_id VARCHAR(100),
            status VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Transactional Lock on employee leave balance row
        let res = await client.query(
          'SELECT * FROM employee_leave_balances WHERE employee_id = $1 FOR UPDATE',
          [employeeId]
        );

        if (res.rows.length === 0) {
          // Initialize row
          await client.query(
            `INSERT INTO employee_leave_balances (employee_id, casual_allocated, casual_used, sick_allocated, sick_used, earned_allocated, earned_used, unpaid_allocated, unpaid_used)
             VALUES ($1, 12, 0, 12, 0, 15, 0, 0, 0)`,
            [employeeId]
          );
          res = await client.query(
            'SELECT * FROM employee_leave_balances WHERE employee_id = $1 FOR UPDATE',
            [employeeId]
          );
        }

        const current = res.rows[0];
        let chosenType = requestedType;

        // Calculate remaining balance for requested type
        let casualRem = current.casual_allocated - current.casual_used;
        let sickRem = current.sick_allocated - current.sick_used;
        let earnedRem = current.earned_allocated - current.earned_used;

        let availableRem = 0;
        if (chosenType === 'CASUAL') availableRem = casualRem;
        else if (chosenType === 'SICK') availableRem = sickRem;
        else if (chosenType === 'EARNED') availableRem = earnedRem;
        else availableRem = 999; // UNPAID has no hard limit

        let status: 'SUCCESS' | 'FALLBACK_UNPAID' | 'FAILED' = 'SUCCESS';
        let notes = `Successfully decremented ${daysToDeduct} day(s) from ${chosenType} leave balance.`;

        // Check if requested type has sufficient balance; if not, find fallback
        if (availableRem < daysToDeduct && chosenType !== 'UNPAID') {
          if (casualRem >= daysToDeduct) {
            chosenType = 'CASUAL';
            availableRem = casualRem;
            notes = `Insufficient ${requestedType} balance. Converted deduction to CASUAL leave balance.`;
          } else if (sickRem >= daysToDeduct) {
            chosenType = 'SICK';
            availableRem = sickRem;
            notes = `Insufficient ${requestedType} balance. Converted deduction to SICK leave balance.`;
          } else if (earnedRem >= daysToDeduct) {
            chosenType = 'EARNED';
            availableRem = earnedRem;
            notes = `Insufficient ${requestedType} balance. Converted deduction to EARNED leave balance.`;
          } else {
            chosenType = 'UNPAID';
            status = 'FALLBACK_UNPAID';
            availableRem = 0;
            notes = `Zero paid leave balance available. Converted deduction to UNPAID / LOP.`;
          }
        }

        const prevBal = availableRem;
        const newBal = chosenType === 'UNPAID' ? 0 : Math.max(0, prevBal - daysToDeduct);

        // Update column in DB
        let updateCol = 'casual_used';
        if (chosenType === 'SICK') updateCol = 'sick_used';
        else if (chosenType === 'EARNED') updateCol = 'earned_used';
        else if (chosenType === 'UNPAID') updateCol = 'unpaid_used';

        await client.query(
          `UPDATE employee_leave_balances SET ${updateCol} = ${updateCol} + $1, updated_at = NOW() WHERE employee_id = $2`,
          [daysToDeduct, employeeId]
        );

        const txId = `tx-lvbal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const txRecord: LeaveBalanceTransaction = {
          id: txId,
          employeeId,
          leaveType: chosenType,
          requestedDays: daysToDeduct,
          deductedDays: daysToDeduct,
          previousBalance: prevBal,
          newBalance: newBal,
          source,
          referenceId,
          timestamp: new Date().toISOString(),
          status,
          notes,
        };

        await client.query(
          `INSERT INTO leave_balance_transactions (id, employee_id, leave_type, requested_days, deducted_days, previous_balance, new_balance, source, reference_id, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            txId,
            employeeId,
            chosenType,
            daysToDeduct,
            daysToDeduct,
            prevBal,
            newBal,
            source,
            referenceId,
            status,
            notes,
          ]
        );

        await client.query('COMMIT');

        // Fetch updated balance record
        const updatedRowRes = await client.query(
          'SELECT * FROM employee_leave_balances WHERE employee_id = $1',
          [employeeId]
        );
        const r = updatedRowRes.rows[0];
        const updatedBalance: EmployeeLeaveBalance = {
          employeeId: r.employee_id,
          casualAllocated: Number(r.casual_allocated),
          casualUsed: Number(r.casual_used),
          sickAllocated: Number(r.sick_allocated),
          sickUsed: Number(r.sick_used),
          earnedAllocated: Number(r.earned_allocated),
          earnedUsed: Number(r.earned_used),
          unpaidAllocated: Number(r.unpaid_allocated),
          unpaidUsed: Number(r.unpaid_used),
          updatedAt: r.updated_at,
        };

        // Sync with mock store
        mockBalances.set(employeeId, updatedBalance);
        transactionsLog.unshift(txRecord);

        return {
          success: true,
          finalLeaveType: chosenType,
          previousBalance: prevBal,
          newBalance: newBal,
          transaction: txRecord,
          balance: updatedBalance,
        };
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Transactional Leave Decrement DB Error]', err);
      } finally {
        client.release();
      }
    }

    // In-memory Transactional Lock simulation
    let currentBalance = await this.getBalance(employeeId);
    let chosenType = requestedType;

    let casualRem = currentBalance.casualAllocated - currentBalance.casualUsed;
    let sickRem = currentBalance.sickAllocated - currentBalance.sickUsed;
    let earnedRem = currentBalance.earnedAllocated - currentBalance.earnedUsed;

    let availableRem = 0;
    if (chosenType === 'CASUAL') availableRem = casualRem;
    else if (chosenType === 'SICK') availableRem = sickRem;
    else if (chosenType === 'EARNED') availableRem = earnedRem;
    else availableRem = 999;

    let status: 'SUCCESS' | 'FALLBACK_UNPAID' | 'FAILED' = 'SUCCESS';
    let notes = `Decremented ${daysToDeduct} day(s) from ${chosenType} balance.`;

    if (availableRem < daysToDeduct && chosenType !== 'UNPAID') {
      if (casualRem >= daysToDeduct) {
        chosenType = 'CASUAL';
        availableRem = casualRem;
        notes = `Insufficient ${requestedType} balance. Used CASUAL leave balance.`;
      } else if (sickRem >= daysToDeduct) {
        chosenType = 'SICK';
        availableRem = sickRem;
        notes = `Insufficient ${requestedType} balance. Used SICK leave balance.`;
      } else if (earnedRem >= daysToDeduct) {
        chosenType = 'EARNED';
        availableRem = earnedRem;
        notes = `Insufficient ${requestedType} balance. Used EARNED leave balance.`;
      } else {
        chosenType = 'UNPAID';
        status = 'FALLBACK_UNPAID';
        availableRem = 0;
        notes = `No paid leave remaining. Subtracted as UNPAID / LOP.`;
      }
    }

    const prevBal = availableRem;
    const newBal = chosenType === 'UNPAID' ? 0 : Math.max(0, prevBal - daysToDeduct);

    // Mutate state accurately
    if (chosenType === 'CASUAL') currentBalance.casualUsed += daysToDeduct;
    else if (chosenType === 'SICK') currentBalance.sickUsed += daysToDeduct;
    else if (chosenType === 'EARNED') currentBalance.earnedUsed += daysToDeduct;
    else if (chosenType === 'UNPAID') currentBalance.unpaidUsed += daysToDeduct;

    currentBalance.updatedAt = new Date().toISOString();
    mockBalances.set(employeeId, currentBalance);

    const txId = `tx-lvbal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const txRecord: LeaveBalanceTransaction = {
      id: txId,
      employeeId,
      leaveType: chosenType,
      requestedDays: daysToDeduct,
      deductedDays: daysToDeduct,
      previousBalance: prevBal,
      newBalance: newBal,
      source,
      referenceId,
      timestamp: new Date().toISOString(),
      status,
      notes,
    };

    transactionsLog.unshift(txRecord);

    return {
      success: true,
      finalLeaveType: chosenType,
      previousBalance: prevBal,
      newBalance: newBal,
      transaction: txRecord,
      balance: currentBalance,
    };
  }

  async getTransactions(employeeId?: string): Promise<LeaveBalanceTransaction[]> {
    if (employeeId) {
      return transactionsLog.filter((t) => t.employeeId === employeeId);
    }
    return transactionsLog;
  }
}
