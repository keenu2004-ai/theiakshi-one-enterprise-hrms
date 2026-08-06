export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Theiakshi-One Enterprise HRMS REST API',
    version: '1.0.0',
    description: 'Enterprise API specification for Authentication, Workforce Management, Attendance, Payroll, Leaves, Expenses, Projects, Document Wallet, and Branch Operations.',
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://hr-portal-backend-gcfp.onrender.com/api/v1',
      description: 'Production Cloud Run Server',
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Employee Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Successful login with JWT token' } },
      },
    },
    '/employees': {
      get: {
        summary: 'List Employees',
        responses: { 200: { description: 'Paginated list of employees' } },
      },
      post: {
        summary: 'Create Employee',
        responses: { 201: { description: 'Employee created successfully' } },
      },
    },
    '/attendance/clock-in': {
      post: {
        summary: 'Attendance Clock In with GPS',
        responses: { 200: { description: 'Clocked in successfully with business rules evaluation' } },
      },
    },
    '/leaves/apply': {
      post: {
        summary: 'Apply for Leave',
        responses: { 201: { description: 'Leave application submitted' } },
      },
    },
    '/payroll/generate': {
      post: {
        summary: 'Generate Monthly Payroll',
        responses: { 200: { description: 'Monthly payroll processed' } },
      },
    },
  },
};

export const postmanCollection = {
  info: {
    name: 'Theiakshi-One Enterprise HRMS API Collection',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Authentication',
      item: [
        {
          name: 'Login',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/auth/login' },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'vaibhav.rajput@theiakshi.com', password: 'password123' }),
            },
          },
        },
        { name: 'Get Profile', request: { method: 'GET', url: { raw: '{{baseUrl}}/auth/profile' } } },
      ],
    },
    {
      name: 'Employees',
      item: [
        { name: 'List Employees', request: { method: 'GET', url: { raw: '{{baseUrl}}/employees' } } },
      ],
    },
    {
      name: 'Attendance',
      item: [
        { name: 'Clock In', request: { method: 'POST', url: { raw: '{{baseUrl}}/attendance/clock-in' } } },
        { name: 'Clock Out', request: { method: 'POST', url: { raw: '{{baseUrl}}/attendance/clock-out' } } },
      ],
    },
  ],
};
