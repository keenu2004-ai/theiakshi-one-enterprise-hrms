# THEIAKSHI ONE — Enterprise Workforce & HR Operations Platform

Welcome to **THEIAKSHI ONE**, a full-stack enterprise workforce management system. This platform handles employee directories, GPS attendance geofencing, leave tracking, payroll processing, expense reimbursements, assets, project tracking, personal document vaults, and system settings.

---

## 💡 How the Whole System Works (In Simple Terms)

1. **Frontend (User Interface)**
   - Built with **React 18 + TypeScript + Vite + Tailwind CSS**.
   - Runs in the browser. Renders the sidebar, header, dashboard, and distinct management modules.
   - Communicates with the backend using `fetch` via the REST API helper (`/src/lib/apiHelper.ts` & `/src/services/apiClient.ts`).
   - Supports **Offline Mode**: Uses IndexedDB (`/src/lib/idb.ts` & `/src/services/offlineSync.ts`) so users can continue working if internet connectivity drops, queuing mutations to sync automatically when reconnected.

2. **Backend (Server & REST APIs)**
   - Built with **Node.js + Express + TypeScript** (`/server.ts` or `/backend/src/app.ts`).
   - Handles authentication (JWT / Session), role-based permissions, data storage, file uploads, and business logic calculation (e.g., geofence calculations, late arrival rules, half-day leave deductions, payslip generation).
   - Serves API routes mounted under `/api/v1/*`.

3. **Database & Storage**
   - **Primary Storage**: PostgreSQL database (configured via `DATABASE_URL` in `/backend/src/database/db.ts` or `/backend/src/config/env.ts`).
   - **Resilient Fallback**: If PostgreSQL is not connected, the system seamlessly uses in-memory mock repositories (`/backend/src/repositories/*`), ensuring the application always boots and functions reliably without crashing.

---

## 📂 File-by-File Guide: Which File Does What

### 🌐 Frontend (`/src`)

| File / Folder | Role & Purpose |
| :--- | :--- |
| **`src/main.tsx`** | Entry point for React. Renders `<App />` inside React's `StrictMode`. |
| **`src/App.tsx`** | Main shell component. Handles routing, sidebar navigation selection, global header, and lazy loading of active modules. |
| **`src/types/index.ts`** | Central TypeScript definition file. Contains interfaces for `Employee`, `AttendanceRecord`, `LeaveRequest`, `ExpenseClaim`, `Payslip`, `Project`, etc. |
| **`src/lib/apiHelper.ts`** | Helper functions (`unwrapData`, `unwrapArray`) to safely normalize API responses whether wrapped in `{ data: ... }` or directly returned. |
| **`src/lib/idb.ts`** | Lightweight IndexedDB client library for local browser database persistence. |
| **`src/services/apiClient.ts`** | Unified API client wrapper for frontend fetch requests with auto-auth header injection. |
| **`src/services/offlineSync.ts`** | Offline synchronization engine. Intercepts network calls when offline, saves them to IndexedDB, and auto-flushes when back online. |
| **`src/context/AuthContext.tsx`** | React Context managing active login session, JWT token, current user profile, role switching (`SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`, etc.), and permissions. |
| **`src/context/NotificationContext.tsx`** | React Context providing global floating toast notifications and AI Copilot drawer state. |

#### 📦 UI Components & Layout (`src/components/layout/` & `src/components/auth/`)
- **`src/components/auth/LoginScreen.tsx`**: Enterprise authentication form with instant quick-login presets for role testing.
- **`src/components/layout/Header.tsx`**: Top navigation bar with user profile dropdown, dark mode toggle, notification bell, and search bar.
- **`src/components/layout/Sidebar.tsx`**: Left sidebar menu with role-filtered module items (e.g., hiding Admin settings from standard employees).
- **`src/components/layout/Breadcrumbs.tsx`**: Dynamic location breadcrumb trail.
- **`src/components/layout/ToastContainer.tsx`**: Floating notification banner renderer.

#### 🛠️ Module Components (`src/components/modules/`)
- **`DashboardView.tsx`**: Executive overview dashboard displaying employee counts, real-time attendance stats, expenditure charts, and quick actions.
- **`EmployeeModule.tsx`**: Full employee directory management (search, filter by department, add new employee modal, edit role/profile, delete employee).
- **`AttendanceModule.tsx`**: Device GPS clock-in/clock-out view, office geofence verification indicator, monthly calendar log, and manual clock-in requests.
- **`LeaveModule.tsx`**: Leave balances card, leave application form, and HR approval/rejection queue.
- **`PayrollModule.tsx`**: Monthly salary slip generator, bulk payroll processing, and downloadable PDF payslips.
- **`ExpensesModule.tsx`**: Expense claim submission, receipt upload viewer, category budget manager, and finance approval.
- **`MyFolderModule.tsx`**: Personal document vault categorized under Govt Docs, Personal Space, Company Docs, and Private Vault.
- **`ProjectsModule.tsx`**: Milestones, task lists, project budgets, and weekly work plan import (Excel / CSV modal).
- **`HelpdeskModule.tsx`**: Internal IT and HR support ticketing system with status tags and priority filters.
- **`AssetsModule.tsx`**: Company hardware (laptops, monitors, devices) custody assignment tracker.
- **`BranchModule.tsx`**: Office location manager (Headquarters, Regional branches, addresses, and staff counts).
- **`OrgModule.tsx`**: Interactive company organization chart and department hierarchy tree.
- **`AuditLogsModule.tsx`**: Immutable security activity log stream tracking logins, document uploads, and profile edits.
- **`SettingsModule.tsx`**: Super Admin control panel for office GPS geofence targets (latitude, longitude, radius in meters), default work hours, and system parameters.

---

### 🖥️ Backend (`/backend` & `/server.ts`)

| File / Folder | Role & Purpose |
| :--- | :--- |
| **`server.ts`** | Primary bundled Express backend server. Contains REST API routes (`/api/v1/*`), authentication endpoints, mock data repositories, and PostgreSQL pool connection initialization with auto-fallback. |
| **`backend/src/app.ts`** | Modular Express application configuration with CORS setup and router attachments. |
| **`backend/src/config/env.ts`** | Environment variable loader (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV`). |
| **`backend/src/database/db.ts`** | PostgreSQL `pg.Pool` connection pool manager. Connects to Postgres/Neon when `DATABASE_URL` is configured. |
| **`backend/src/routes/*`** | Modular route files (`employeeRoutes.ts`, `attendanceRoutes.ts`, `leaveRoutes.ts`, `expenseRoutes.ts`, `payrollRoutes.ts`, `branchRoutes.ts`, `projectRoutes.ts`, `documentRoutes.ts`). |
| **`backend/src/repositories/*`** | Data repositories (`employeeRepository.ts`, `attendanceRepository.ts`, `leaveRepository.ts`, `expenseRepository.ts`, `branchRepository.ts`, `projectRepository.ts`) handling SQL queries with in-memory fallbacks. |
| **`backend/src/middleware/auth.ts`** | JWT verification middleware and role-based access checks (`requireRoles(...)`). |
| **`schema.sql`** | PostgreSQL database table creation schema (employees, attendance, leaves, expenses, payslips, branches, projects, etc.). |

---

## ⚙️ How Tasks & Features Perform Step-by-Step

### 1. Attendance GPS Clock-In & Geofencing Workflow
1. Employee clicks **Clock In** inside `AttendanceModule.tsx`.
2. Browser calls HTML5 `navigator.geolocation.getCurrentPosition()`.
3. The app measures the Haversine distance (in meters) between user GPS coordinates and target office coordinates defined in **Settings**.
4. If distance $\le$ configured office radius: Status set to `VERIFIED`. Otherwise, set to `OUTSIDE_GEOFENCE`.
5. Time check:
   - Arrival after 09:15 AM $\rightarrow$ Marked `LATE`.
   - Arrival after 11:30 AM $\rightarrow$ Marked `HALF_DAY`.
   - **Automated Rule**: 2 accumulated `HALF_DAY` records automatically generate a 1-day Casual Leave deduction.

### 2. Expense Claim Submission & Approval Workflow
1. Employee fills form in `ExpensesModule.tsx` with date, amount, category, and receipt image/document.
2. Sends POST request to `/api/v1/expenses`.
3. Claims appear as `PENDING` for Finance Admin / HR Manager.
4. Approver clicks **Approve** or **Reject** $\rightarrow$ PUT `/api/v1/expenses/claims/:id/approve` updates status and sends toast notification.

### 3. Personal Document Vault ("My Folder")
1. Employee navigates to `MyFolderModule.tsx`.
2. Files are classified into 4 secure buckets: *Govt Docs*, *Personal*, *Company*, *Private Vault*.
3. Files uploaded via browser Base64 string are saved to employee record and cached locally in IndexedDB for offline access.

---

## 🛠️ How to Make Changes Manually

### Scenario A: How to Add a New UI Module or Page
1. **Define TypeScript Interface**: Add types in `/src/types/index.ts`.
2. **Create Module Component**: Create `/src/components/modules/MyNewModule.tsx`.
3. **Register in Sidebar**: Edit `/src/components/layout/Sidebar.tsx` and add an entry under `navigationGroups`.
4. **Register in App Router**: Edit `/src/App.tsx`:
   - Import `MyNewModule`.
   - Add a case inside `renderModule()`:
     ```tsx
     case 'my_new_module':
       return <MyNewModule />;
     ```

### Scenario B: How to Add a New Backend API Endpoint
1. Open `/server.ts` (or the respective route in `/backend/src/routes/`).
2. Register the endpoint:
   ```typescript
   app.get('/api/v1/custom-data', (req, res) => {
     res.json({ success: true, data: [ /* your data */ ] });
   });
   ```
3. Call it from your frontend component:
   ```typescript
   import { unwrapArray } from '../../lib/apiHelper';
   
   fetch('/api/v1/custom-data')
     .then((r) => r.json())
     .then((res) => {
       const items = unwrapArray(res);
       console.log(items);
     });
   ```

### Scenario C: How to Modify Database Schema
1. Open `/schema.sql`.
2. Add your SQL table definition or new columns.
3. Update repository mapping in `/backend/src/repositories/` to include new database fields in SQL queries.

### Scenario D: How to Modify Theme Colors or Styling
1. Open `/src/index.css` for global CSS adjustments or Tailwind theme definitions.
2. Update Tailwind utility classes (`bg-slate-900`, `text-indigo-600`, `border-slate-200`, etc.) directly inside the component files.

---

## 🚀 How to Build & Run Locally

### 1. Install Dependencies
```bash
npm install
# or if using Bun:
bun install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
npm start
```
Target output bundle will be generated in `/dist` and launched via Express node server.
