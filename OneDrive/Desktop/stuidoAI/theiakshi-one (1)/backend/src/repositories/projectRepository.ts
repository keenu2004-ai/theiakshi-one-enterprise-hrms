import { executeQuery } from '../database/db';

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  department: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress: number;
  deadline: string;
  budget: number;
}

let mockProjects: Project[] = [
  {
    id: 'proj-1',
    code: 'PRJ-1001',
    name: 'Theiakshi AI HR Analytics Engine',
    client: 'Internal Enterprise R&D',
    department: 'ENGINEERING',
    status: 'IN_PROGRESS',
    progress: 88,
    deadline: '2026-09-30',
    budget: 4500000,
  },
  {
    id: 'proj-2',
    code: 'PRJ-1002',
    name: 'Automated Payroll & Attendance Pipeline',
    client: 'Global Workforce Services',
    department: 'FINANCE',
    status: 'IN_PROGRESS',
    progress: 92,
    deadline: '2026-08-31',
    budget: 3200000,
  },
];

export class ProjectRepository {
  async findAll(): Promise<Project[]> {
    try {
      const rows = await executeQuery('SELECT * FROM projects ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        const sqlProjects: Project[] = rows.map((r) => ({
          id: r.id,
          code: r.code || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
          name: r.name,
          client: r.client_name || 'Enterprise',
          department: r.department || 'ENGINEERING',
          status: r.status || 'IN_PROGRESS',
          progress: Number(r.completion_percentage || 50),
          deadline: String(r.deadline || '2026-12-31').slice(0, 10),
          budget: Number(r.budget || 0),
        }));
        const map = new Map<string, Project>();
        mockProjects.forEach((p) => map.set(p.id, p));
        sqlProjects.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      }
    } catch (e) {}
    return mockProjects;
  }

  async save(project: Project): Promise<Project> {
    if (!project.id) project.id = `proj-${Date.now()}`;
    if (!project.code) project.code = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;

    const idx = mockProjects.findIndex((p) => p.id === project.id);
    if (idx >= 0) mockProjects[idx] = project;
    else mockProjects.push(project);

    try {
      await executeQuery(
        `INSERT INTO projects (id, code, name, client_name, department, status, completion_percentage, deadline, budget)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, completion_percentage = EXCLUDED.completion_percentage`,
        [
          project.id,
          project.code,
          project.name,
          project.client,
          project.department,
          project.status,
          project.progress,
          project.deadline,
          project.budget,
        ]
      );
    } catch (e) {}

    return project;
  }
}
