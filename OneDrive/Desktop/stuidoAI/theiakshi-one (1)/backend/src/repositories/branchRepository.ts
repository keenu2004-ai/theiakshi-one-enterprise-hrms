import { executeQuery } from '../database/db';

export interface Branch {
  id: string;
  code: string;
  name: string;
  region: 'NORTH' | 'SOUTH' | 'WEST' | 'EAST';
  city: string;
  state: string;
  isHeadquarters: boolean;
  employeeCount: number;
}

let mockBranches: Branch[] = [
  {
    id: 'br-1',
    code: 'BLR-HQ',
    name: 'Bengaluru Global HQ',
    region: 'SOUTH',
    city: 'Bengaluru',
    state: 'Karnataka',
    isHeadquarters: true,
    employeeCount: 65,
  },
  {
    id: 'br-2',
    code: 'DEL-HUB',
    name: 'Delhi NCR Innovation Hub',
    region: 'NORTH',
    city: 'Gurugram',
    state: 'Haryana',
    isHeadquarters: false,
    employeeCount: 32,
  },
  {
    id: 'br-3',
    code: 'BOM-FIN',
    name: 'Mumbai Financial Center',
    region: 'WEST',
    city: 'Mumbai',
    state: 'Maharashtra',
    isHeadquarters: false,
    employeeCount: 24,
  },
];

export class BranchRepository {
  async findAll(): Promise<Branch[]> {
    try {
      const rows = await executeQuery('SELECT * FROM branches ORDER BY created_at ASC');
      if (rows && rows.length > 0) {
        const sqlBranches: Branch[] = rows.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          region: r.region as any,
          city: r.city,
          state: r.state,
          isHeadquarters: !!r.is_headquarters,
          employeeCount: Number(r.employee_count || 30),
        }));
        const map = new Map<string, Branch>();
        mockBranches.forEach((b) => map.set(b.id, b));
        sqlBranches.forEach((b) => map.set(b.id, b));
        return Array.from(map.values());
      }
    } catch (e) {}
    return mockBranches;
  }

  async save(branch: Branch): Promise<Branch> {
    if (!branch.id) branch.id = `br-${Date.now()}`;
    if (!branch.code) branch.code = `BR-${Math.floor(100 + Math.random() * 900)}`;

    const idx = mockBranches.findIndex((b) => b.id === branch.id);
    if (idx >= 0) mockBranches[idx] = branch;
    else mockBranches.push(branch);

    try {
      await executeQuery(
        `INSERT INTO branches (id, code, name, region, city, state, is_headquarters)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [
          branch.id,
          branch.code,
          branch.name,
          branch.region,
          branch.city,
          branch.state,
          branch.isHeadquarters,
        ]
      );
    } catch (e) {}

    return branch;
  }
}
