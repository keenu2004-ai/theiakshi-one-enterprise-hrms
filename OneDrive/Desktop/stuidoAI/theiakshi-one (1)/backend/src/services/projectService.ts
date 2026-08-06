import { ProjectRepository, Project } from '../repositories/projectRepository';

const repo = new ProjectRepository();

export class ProjectService {
  async getAllProjects() {
    return repo.findAll();
  }

  async createProject(data: Partial<Project>) {
    const project: Project = {
      id: `proj-${Date.now()}`,
      code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name || 'New Project',
      client: data.client || 'Enterprise Client',
      department: data.department || 'ENGINEERING',
      status: 'IN_PROGRESS',
      progress: data.progress || 0,
      deadline: data.deadline || '2026-12-31',
      budget: data.budget || 1000000,
    };

    return repo.save(project);
  }
}
