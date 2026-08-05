// Centralized Frontend API Client for Backend Proxying & Auth Generation
import { offlineSyncService } from './offlineSync';
import { AttendanceRecord, Employee, LeaveRequest, ExpenseClaim, HelpdeskTicket } from '../types';
import { STORES } from '../lib/idb';

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('theiakshi_auth_token') || null;
};

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('theiakshi_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) {
          headers['X-Employee-Id'] = parsed.id;
        }
      }
    } catch (e) {}
  }
  return headers;
};

export class ApiClient {
  /**
   * Generic authenticated request wrapper
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error?: string }> {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      let body: any = null;
      if (contentType && contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      if (!response.ok) {
        return {
          data: null,
          error: (body && body.message) || `HTTP error ${response.status}: ${response.statusText}`,
        };
      }

      return { data: body as T };
    } catch (err: any) {
      console.warn(`[ApiClient] Fetch failed for ${endpoint}:`, err);
      return { data: null, error: err?.message || 'Network request failed' };
    }
  }

  // ==========================================
  // ATTENDANCE MODULE BACKEND APIs
  // ==========================================
  public attendance = {
    getRecords: async (): Promise<AttendanceRecord[]> => {
      const res = await offlineSyncService.apiFetch<AttendanceRecord[]>(
        '/api/v1/attendance',
        { headers: getAuthHeaders() },
        { store: STORES.ATTENDANCE, module: 'Attendance', description: 'Fetch attendance logs' }
      );
      return res.data || [];
    },

    clockIn: async (payload: {
      employeeId: string;
      location?: string;
      gpsCoordinates?: { lat: number; lng: number };
    }) => {
      const res = await offlineSyncService.apiFetch<any>(
        '/api/v1/attendance/clock-in',
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
        { store: STORES.ATTENDANCE, module: 'Attendance', description: 'Clock In action' }
      );
      // Dispatch global event for instant UI sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('attendanceUpdated', { detail: { action: 'clockIn', data: res.data } }));
      }
      return res;
    },

    clockOut: async (payload: { employeeId: string; location?: string }) => {
      const res = await offlineSyncService.apiFetch<any>(
        '/api/v1/attendance/clock-out',
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
        { store: STORES.ATTENDANCE, module: 'Attendance', description: 'Clock Out action' }
      );
      // Dispatch global event for instant UI sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('attendanceUpdated', { detail: { action: 'clockOut', data: res.data } }));
      }
      return res;
    },

    regularize: async (employeeId: string, date: string, reason: string) => {
      return offlineSyncService.apiFetch<any>(
        '/api/v1/attendance/regularize',
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ employeeId, date, reason }),
        },
        { store: STORES.ATTENDANCE, module: 'Attendance', description: 'Attendance regularization claim' }
      );
    },
  };

  // ==========================================
  // AUTHENTICATION BACKEND APIs
  // ==========================================
  public auth = {
    login: async (email: string, password?: string) => {
      return fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    },

    getMe: async () => {
      return this.request<{ user: Employee }>('/api/v1/auth/me');
    },
  };

  // ==========================================
  // EMPLOYEES & WORKFORCE APIs
  // ==========================================
  public employees = {
    getAll: async (params?: { search?: string; department?: string; role?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.department) query.append('department', params.department);
      if (params?.role) query.append('role', params.role);
      if (params?.status) query.append('status', params.status);

      const url = `/api/v1/employees${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await offlineSyncService.apiFetch<Employee[]>(
        url,
        { headers: getAuthHeaders() },
        { store: STORES.EMPLOYEES, module: 'Employee Directory', description: 'Get employee list' }
      );
      return res.data || [];
    },

    getById: async (id: string) => {
      return this.request<Employee>(`/api/v1/employees/${id}`);
    },

    update: async (id: string, updates: Partial<Employee>) => {
      return this.request<Employee>(`/api/v1/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
  };
}

export const apiClient = new ApiClient();
