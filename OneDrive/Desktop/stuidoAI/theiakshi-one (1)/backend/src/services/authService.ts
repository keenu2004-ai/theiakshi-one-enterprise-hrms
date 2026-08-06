import { EmployeeRepository } from '../repositories/employeeRepository';

const repo = new EmployeeRepository();

export class AuthService {
  async login(email: string, _password: string) {
    const employee = await repo.findByEmail(email);
    if (!employee) {
      throw new Error('Invalid email or password');
    }

    const tokenPayload = {
      id: employee.id,
      employeeId: employee.id,
      email: employee.email,
      role: employee.role,
      name: `${employee.firstName} ${employee.lastName}`,
    };

    // Construct mock JWT string with encoded JSON header.payload.signature
    const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature_verification_key`;

    return {
      token,
      refreshToken: `ref_${Date.now()}_${employee.id}`,
      user: {
        id: employee.id,
        employeeCode: employee.code,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        avatar: employee.avatar,
      },
    };
  }

  async getProfile(employeeId: string) {
    const employee = await repo.findById(employeeId);
    if (!employee) throw new Error('Employee profile not found');
    return employee;
  }
}
