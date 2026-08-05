import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';
import { STORES, putRecord, getRecord, getAllRecords, deleteRecord, putRecords } from '../lib/idb';
import { offlineSyncService } from '../services/offlineSync';

interface AuthContextType {
  currentUser: Employee;
  currentRole: UserRole;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setUserById: (id: string) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  availableUsers: Employee[];
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: Employee = {
  id: 'emp-0a',
  code: 'TOK-1000',
  firstName: 'Vaibhav',
  lastName: 'Rajput',
  email: 'vaibhav.rajput@theiakshi.com',
  password: 'password123',
  phone: '+91 98765 00000',
  role: 'SUPER_ADMIN',
  department: 'EXECUTIVE',
  designation: 'Managing Director & CEO',
  status: 'ACTIVE',
  joiningDate: '2021-01-01',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  location: 'Headquarters, Bengaluru',
  address: 'Indiranagar 100ft Road, Bengaluru',
  gender: 'MALE',
  dob: '1990-01-01',
  maritalStatus: 'SINGLE',
  skills: ['Architecture', 'Cloud', 'Leadership'],
  salary: {
    basic: 150000,
    hra: 60000,
    specialAllowance: 40000,
    conveyance: 10000,
    pfEmployee: 18000,
    pfEmployer: 18000,
    esiEmployee: 0,
    tdsTax: 30000,
    grossSalary: 260000,
    netSalary: 212000,
  },
  emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+91 98765 00001' },
  bankDetails: {
    accountNumber: '91802003849999',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    branchName: 'Main Branch',
    panNumber: 'ABCDE9999F',
    pfUan: '100982349999',
  },
  documents: [],
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  DEFAULT_USER,
  {
    id: 'emp-0b',
    code: 'TOK-1000B',
    firstName: 'Vaibhav',
    lastName: 'Arya',
    email: 'vaibhavarya058@gmail.com',
    password: 'password123',
    phone: '+91 98765 00001',
    role: 'SUPER_ADMIN',
    department: 'EXECUTIVE',
    designation: 'Managing Director & CEO',
    status: 'ACTIVE',
    joiningDate: '2021-01-01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Indiranagar, Bengaluru',
    gender: 'MALE',
    dob: '1990-01-01',
    maritalStatus: 'SINGLE',
    skills: ['Architecture', 'Leadership'],
    salary: { basic: 150000, hra: 60000, specialAllowance: 40000, conveyance: 10000, pfEmployee: 18000, pfEmployer: 18000, esiEmployee: 0, tdsTax: 30000, grossSalary: 260000, netSalary: 212000 },
    emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+91 98765 00001' },
    bankDetails: { accountNumber: '91802003849999', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', branchName: 'Main Branch', panNumber: 'ABCDE9999F', pfUan: '100982349999' },
    documents: [],
  },
  {
    id: 'emp-1',
    code: 'TOK-1001',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'arjun.sharma@theiakshi.com',
    password: 'admin123',
    phone: '+91 98765 43210',
    role: 'SUPER_ADMIN',
    department: 'ENGINEERING',
    designation: 'Chief Technology Officer',
    status: 'ACTIVE',
    joiningDate: '2021-01-15',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Indiranagar 100ft Road, Bengaluru',
    gender: 'MALE',
    dob: '1988-06-20',
    maritalStatus: 'MARRIED',
    skills: ['Architecture', 'Cloud', 'Leadership'],
    salary: { basic: 120000, hra: 48000, specialAllowance: 32000, conveyance: 10000, pfEmployee: 14400, pfEmployer: 14400, esiEmployee: 0, tdsTax: 25000, grossSalary: 210000, netSalary: 170600 },
    emergencyContact: { name: 'Priya Sharma', relationship: 'Spouse', phone: '+91 98765 11111' },
    bankDetails: { accountNumber: '91802003841120', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', branchName: 'Koramangala', panNumber: 'ABCDE1234F', pfUan: '100982341122' },
    documents: [],
  },
  {
    id: 'emp-2',
    code: 'TOK-1002',
    firstName: 'Sneha',
    lastName: 'Kulkarni',
    email: 'sneha.kulkarni@theiakshi.com',
    password: 'password123',
    phone: '+91 98123 45678',
    role: 'HR_MANAGER',
    department: 'HUMAN_RESOURCES',
    designation: 'VP of Human Capital',
    status: 'ACTIVE',
    joiningDate: '2021-04-01',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'HSR Layout, Bengaluru',
    gender: 'FEMALE',
    dob: '1991-11-12',
    maritalStatus: 'MARRIED',
    skills: ['Talent Acquisition', 'HR Compliance'],
    salary: { basic: 95000, hra: 38000, specialAllowance: 25000, conveyance: 8000, pfEmployee: 11400, pfEmployer: 11400, esiEmployee: 0, tdsTax: 18000, grossSalary: 166000, netSalary: 136600 },
    emergencyContact: { name: 'Rohan Kulkarni', relationship: 'Spouse', phone: '+91 98123 99999' },
    bankDetails: { accountNumber: '50100239120488', bankName: 'ICICI Bank', ifscCode: 'ICIC0000412', branchName: 'Indiranagar', panNumber: 'FGHIJ5678K', pfUan: '100982341123' },
    documents: [],
  },
  {
    id: 'emp-3',
    code: 'TOK-1003',
    firstName: 'Vikram',
    lastName: 'Verma',
    email: 'vikram.verma@theiakshi.com',
    password: 'password123',
    phone: '+91 97654 32109',
    role: 'TEAM_MANAGER',
    department: 'ENGINEERING',
    designation: 'Engineering Lead',
    status: 'ACTIVE',
    joiningDate: '2022-02-01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Whitefield, Bengaluru',
    gender: 'MALE',
    dob: '1993-03-25',
    maritalStatus: 'SINGLE',
    skills: ['Node.js', 'React', 'Agile'],
    salary: { basic: 85000, hra: 34000, specialAllowance: 21000, conveyance: 6000, pfEmployee: 10200, pfEmployer: 10200, esiEmployee: 0, tdsTax: 14000, grossSalary: 146000, netSalary: 121800 },
    emergencyContact: { name: 'Sunil Verma', relationship: 'Father', phone: '+91 97654 88888' },
    bankDetails: { accountNumber: '302910023912', bankName: 'Axis Bank', ifscCode: 'UTIB0000210', branchName: 'Whitefield', panNumber: 'KLMNO9012P', pfUan: '100982341124' },
    documents: [],
  },
  {
    id: 'emp-4',
    code: 'TOK-1004',
    firstName: 'Ananya',
    lastName: 'Rao',
    email: 'ananya.rao@theiakshi.com',
    password: 'password123',
    phone: '+91 96543 21098',
    role: 'EMPLOYEE',
    department: 'PRODUCT',
    designation: 'Senior Product Designer',
    status: 'ACTIVE',
    joiningDate: '2022-08-15',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Koramangala, Bengaluru',
    gender: 'FEMALE',
    dob: '1995-08-19',
    maritalStatus: 'SINGLE',
    skills: ['UI/UX', 'Figma', 'User Research'],
    salary: { basic: 70000, hra: 28000, specialAllowance: 18000, conveyance: 5000, pfEmployee: 8400, pfEmployer: 8400, esiEmployee: 0, tdsTax: 10000, grossSalary: 121000, netSalary: 102600 },
    emergencyContact: { name: 'Kavita Rao', relationship: 'Mother', phone: '+91 96543 77777' },
    bankDetails: { accountNumber: '601290381029', bankName: 'SBI', ifscCode: 'SBIN0001002', branchName: 'MG Road', panNumber: 'QRSTU3456V', pfUan: '100982341125' },
    documents: [],
  },
  {
    id: 'emp-5',
    code: 'TOK-1005',
    firstName: 'Rajesh',
    lastName: 'Nair',
    email: 'rajesh.nair@theiakshi.com',
    password: 'password123',
    phone: '+91 95432 10987',
    role: 'FINANCE',
    department: 'FINANCE',
    designation: 'Finance Controller',
    status: 'ACTIVE',
    joiningDate: '2023-01-10',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'JP Nagar, Bengaluru',
    gender: 'MALE',
    dob: '1989-04-14',
    maritalStatus: 'MARRIED',
    skills: ['Financial Analysis', 'Payroll Audit', 'Taxation'],
    salary: { basic: 90000, hra: 36000, specialAllowance: 24000, conveyance: 7000, pfEmployee: 10800, pfEmployer: 10800, esiEmployee: 0, tdsTax: 16000, grossSalary: 157000, netSalary: 130200 },
    emergencyContact: { name: 'Sujatha Nair', relationship: 'Spouse', phone: '+91 95432 66666' },
    bankDetails: { accountNumber: '102938475610', bankName: 'Kotak Mahindra Bank', ifscCode: 'KKBK0000120', branchName: 'Jayanagar', panNumber: 'VWXYZ7890A', pfUan: '100982341126' },
    documents: [],
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableUsers, setAvailableUsers] = useState<Employee[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  const [currentUser, setCurrentUser] = useState<Employee>(() => {
    try {
      const saved = localStorage.getItem('theiakshi_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved user', e);
    }
    return DEFAULT_USER;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('theiakshi_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role || 'SUPER_ADMIN';
      }
    } catch (e) {}
    return 'SUPER_ADMIN';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('theiakshi_auth_user');
  });

  // Track online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOfflineMode(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Sync auth session and employees store from IndexedDB
  const refreshUserData = async () => {
    try {
      // 0. Pre-seed default employees into IndexedDB if empty
      const existingDbEmployees = await getAllRecords<Employee>(STORES.EMPLOYEES);
      if (!existingDbEmployees || existingDbEmployees.length === 0) {
        console.log('[AuthContext] Initializing IndexedDB with default company employees...');
        await putRecords(STORES.EMPLOYEES, DEFAULT_EMPLOYEES);
        setAvailableUsers(DEFAULT_EMPLOYEES);
      } else {
        setAvailableUsers(existingDbEmployees);
      }

      // 1. Check IndexedDB cached session
      const idbSession = await getRecord<{ id: string; user: Employee; token: string }>(STORES.AUTH_SESSION, 'current_session');
      if (idbSession?.user) {
        setCurrentUser(idbSession.user);
        setCurrentRole(idbSession.user.role);
        setIsAuthenticated(true);
      }

      // 2. Fetch employees using offline-aware API service
      const res = await offlineSyncService.apiFetch<Employee[]>('/api/v1/employees', {}, {
        store: STORES.EMPLOYEES,
        module: 'Employee Directory',
        description: 'Sync employee database',
      });

      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAvailableUsers(res.data);
        const updatedCurrent = res.data.find((u: Employee) => u.id === currentUser.id);
        if (updatedCurrent) {
          setCurrentUser(updatedCurrent);
          setCurrentRole(updatedCurrent.role);
          localStorage.setItem('theiakshi_auth_user', JSON.stringify(updatedCurrent));
          await putRecord(STORES.AUTH_SESSION, { id: 'current_session', user: updatedCurrent, token: 'offline_token' });
        }
      }
    } catch (err) {
      console.warn('Network sync notice during user data refresh, using offline cached state:', err);
      if (availableUsers.length === 0) {
        setAvailableUsers(DEFAULT_EMPLOYEES);
      }
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Online Server Login (relative first, then fallback to Render backend URL)
    const apiEndpoints = [
      '/api/v1/auth/login',
      'https://hr-portal-backend-gcfp.onrender.com/api/v1/auth/login'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        if (response.ok) {
          const data = await response.json();
          const loggedInUser: Employee = data.user;
          setCurrentUser(loggedInUser);
          setCurrentRole(loggedInUser.role);
          setIsAuthenticated(true);

          // Store in localStorage AND IndexedDB auth session
          localStorage.setItem('theiakshi_auth_user', JSON.stringify(loggedInUser));
          localStorage.setItem('theiakshi_auth_token', data.token || `token_${Date.now()}`);

          await putRecord(STORES.AUTH_SESSION, {
            id: 'current_session',
            user: loggedInUser,
            token: data.token || `token_${Date.now()}`,
            timestamp: new Date().toISOString(),
          });

          await putRecord(STORES.EMPLOYEES, loggedInUser);

          return { success: true };
        }
      } catch (err) {
        console.warn(`[AuthContext] Network login failed for ${endpoint}:`, err);
      }
    }

    // 2. Offline / Standalone Fallback: Check IndexedDB Employees, DEFAULT_EMPLOYEES & Session Store
    try {
      let cachedEmployees = await getAllRecords<Employee>(STORES.EMPLOYEES);
      if (!cachedEmployees || cachedEmployees.length === 0) {
        await putRecords(STORES.EMPLOYEES, DEFAULT_EMPLOYEES);
        cachedEmployees = DEFAULT_EMPLOYEES;
      }

      let matchedUser = cachedEmployees.find((e) => e.email.toLowerCase() === cleanEmail);

      if (!matchedUser) {
        matchedUser = DEFAULT_EMPLOYEES.find((e) => e.email.toLowerCase() === cleanEmail);
      }

      if (!matchedUser) {
        const cachedSession = await getRecord<{ id: string; user: Employee }>(STORES.AUTH_SESSION, 'current_session');
        if (cachedSession?.user && cachedSession.user.email.toLowerCase() === cleanEmail) {
          matchedUser = cachedSession.user;
        }
      }

      // 3. Dynamic Account Provisioning for any email provided in offline / standalone mode
      if (!matchedUser && cleanEmail.includes('@')) {
        const parts = cleanEmail.split('@')[0].split('.');
        const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Vaibhav';
        const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Rajput';

        matchedUser = {
          id: `emp-dyn-${Date.now()}`,
          code: `TOK-${Math.floor(1000 + Math.random() * 9000)}`,
          firstName,
          lastName,
          email: cleanEmail,
          password: password || 'password123',
          phone: '+91 98765 00000',
          role: cleanEmail.includes('admin') || cleanEmail.includes('vaibhav') || cleanEmail.includes('theiakshi') ? 'SUPER_ADMIN' : 'EMPLOYEE',
          department: 'EXECUTIVE',
          designation: 'Enterprise Member',
          status: 'ACTIVE',
          joiningDate: new Date().toISOString().split('T')[0],
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          location: 'Headquarters, Bengaluru',
          address: 'Indiranagar, Bengaluru',
          gender: 'MALE',
          dob: '1992-01-01',
          maritalStatus: 'SINGLE',
          skills: ['Management', 'Strategy'],
          salary: {
            basic: 120000,
            hra: 48000,
            specialAllowance: 32000,
            conveyance: 10000,
            pfEmployee: 14400,
            pfEmployer: 14400,
            esiEmployee: 0,
            tdsTax: 25000,
            grossSalary: 210000,
            netSalary: 170600,
          },
          emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+91 98765 00001' },
          bankDetails: {
            accountNumber: '91802003849999',
            bankName: 'HDFC Bank',
            ifscCode: 'HDFC0001234',
            branchName: 'Main Branch',
            panNumber: 'ABCDE9999F',
            pfUan: '100982349999',
          },
          documents: [],
        };
      }

      if (matchedUser) {
        setCurrentUser(matchedUser);
        setCurrentRole(matchedUser.role);
        setIsAuthenticated(true);

        localStorage.setItem('theiakshi_auth_user', JSON.stringify(matchedUser));
        localStorage.setItem('theiakshi_auth_token', `offline_token_${Date.now()}`);

        await putRecord(STORES.AUTH_SESSION, {
          id: 'current_session',
          user: matchedUser,
          token: `offline_token_${Date.now()}`,
          timestamp: new Date().toISOString(),
        });

        await putRecord(STORES.EMPLOYEES, matchedUser);

        return {
          success: true,
          message: 'Authenticated successfully in Offline / Standalone Mode.',
        };
      }
    } catch (idbErr) {
      console.error('[AuthContext] IndexedDB offline auth error:', idbErr);
    }

    return {
      success: false,
      message: 'Unable to authenticate. Please check your company email address.',
    };
  };

  const logout = async () => {
    localStorage.removeItem('theiakshi_auth_user');
    localStorage.removeItem('theiakshi_auth_token');
    await deleteRecord(STORES.AUTH_SESSION, 'current_session');
    setIsAuthenticated(false);
  };

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    const matchingUser = availableUsers.find((u) => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
      localStorage.setItem('theiakshi_auth_user', JSON.stringify(matchingUser));
    } else {
      setCurrentUser((prev) => {
        const updated = { ...prev, role };
        localStorage.setItem('theiakshi_auth_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const setUserById = (id: string) => {
    const user = availableUsers.find((u) => u.id === id);
    if (user) {
      setCurrentUser(user);
      setCurrentRole(user.role);
      localStorage.setItem('theiakshi_auth_user', JSON.stringify(user));
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (currentRole === 'SUPER_ADMIN') return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(currentRole);
  };

  const hasPermission = (permission: string): boolean => {
    if (currentRole === 'SUPER_ADMIN') return true;
    
    switch (currentRole) {
      case 'HR_MANAGER':
        return !permission.includes('system:delete');
      case 'TEAM_MANAGER':
        return ['employee:read', 'leave:approve', 'attendance:read', 'performance:write', 'timesheet:approve'].some((p) =>
          permission.includes(p)
        );
      case 'RECRUITER':
        return permission.startsWith('recruitment:') || permission.startsWith('candidate:');
      case 'FINANCE':
        return permission.startsWith('payroll:') || permission.startsWith('finance:') || permission.startsWith('asset:');
      case 'PAYROLL_TEAM':
        return permission.startsWith('payroll:');
      case 'EMPLOYEE':
        return (
          permission.endsWith(':self') ||
          permission === 'leave:apply' ||
          permission === 'attendance:clock' ||
          permission === 'helpdesk:create'
        );
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        isOfflineMode,
        login,
        logout,
        setRole,
        setUserById,
        hasRole,
        hasPermission,
        availableUsers,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
