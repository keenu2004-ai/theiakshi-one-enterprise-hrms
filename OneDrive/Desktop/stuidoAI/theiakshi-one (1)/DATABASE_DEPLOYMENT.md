# THEIAKSHI ENTERPRISES - Database Deployment & Migration Guide

This repository includes a production-ready relational SQL database file (`/schema.sql`) and a persistent JSON dataset file (`/src/data/database.json`) for seamless deployment across Cloud Run, Cloud SQL, Docker, PostgreSQL, MySQL, and SQLite environments.

---

## 📁 Key Database Files

1. **`schema.sql`** (Project Root)
   - Complete ANSI SQL schema definitions with DDL (`CREATE TABLE`, primary keys, foreign keys, constraints, and indexes).
   - Initial seed data (DML `INSERT INTO` statements) for employees, credentials, departments, branches, geofence settings, holidays, and system configurations.
   - Compatible with **PostgreSQL 12+**, **Google Cloud SQL**, **AWS RDS / Aurora**, **MySQL 8.0+**, **Supabase**, **Neon**, and **SQLite 3**.

2. **`src/data/database.json`** (Persistent JSON Storage)
   - Full JSON object database dump containing all collections.
   - Automatically updated when state changes occur on the backend server.
   - Used for zero-config file-based persistent deployment (e.g., Docker volumes or Cloud Run mounted storage).

3. **`src/data/credentials.json`**
   - Active user credentials and password hashes synced in real-time.

---

## 🗄️ Database Tables Overview

| Table Name | Description | Key Fields |
| :--- | :--- | :--- |
| `system_config` | Core HRMS settings, shift hours, grace periods | `id`, `company_name`, `shift_start_time`, `shift_end_time` |
| `geofence_settings` | Office GPS location & radius limits | `office_name`, `latitude`, `longitude`, `radius_meters` |
| `branches` | Regional company offices | `code`, `name`, `region`, `city`, `is_headquarters` |
| `workspaces` | Geofenced physical & hybrid workspaces | `name`, `location`, `latitude`, `longitude`, `radius_meters` |
| `departments` | Organizational departments & budgets | `name`, `label`, `head_name`, `budget_monthly` |
| `employees` | Full employee profiles & salary details | `code`, `first_name`, `last_name`, `email`, `role`, `department` |
| `credentials` | Login authentication records | `employee_id`, `email`, `password_hash`, `role` |
| `attendance_records` | Clock in/out logs & GPS coordinates | `employee_id`, `date`, `clock_in`, `clock_out`, `status` |
| `leave_requests` | Leave applications & approvals | `employee_id`, `type`, `start_date`, `end_date`, `status` |
| `yearly_leave_ledgers` | Annual leave quotas & balance tracking | `employee_id`, `year`, `casual_balance`, `sick_balance` |
| `payslips` | Monthly payroll slips & salary calculations | `employee_id`, `month`, `gross_earnings`, `net_pay` |
| `expense_claims` | Expense reimbursements & receipts | `employee_id`, `category`, `amount`, `status` |
| `expense_categories` | Expense policy claim limits | `name`, `label`, `max_limit_per_claim` |
| `job_postings` | Open careers & job requisitions | `title`, `department`, `location`, `openings`, `status` |
| `candidates` | Applicant pipeline & interview scores | `job_id`, `full_name`, `stage`, `rating` |
| `assets` | Hardware & IT asset allocations | `asset_code`, `name`, `category`, `assigned_to_id` |
| `helpdesk_tickets` | Support tickets & resolution workflow | `ticket_number`, `subject`, `priority`, `status` |
| `projects` | Strategic projects & progress metrics | `code`, `name`, `client_name`, `budget`, `completion_percentage` |
| `weekly_tasks` | Task assignments & deadline tracking | `assigned_to_id`, `title`, `due_date`, `priority`, `status` |
| `holidays` | Enterprise calendar holidays & events | `name`, `date`, `type`, `region`, `color_hex` |
| `celebration_events` | Birthdays, work anniversaries, recognitions | `employee_name`, `event_type`, `event_date` |
| `audit_logs` | System security & activity audit logs | `user_name`, `action`, `module`, `ip_address`, `timestamp` |
| `notifications` | User alerts & system push notifications | `recipient_id`, `title`, `message`, `is_read` |

---

## 🚀 How to Deploy the Database

### Option A: PostgreSQL / Cloud SQL / Supabase / Neon

1. Create a database instance on your provider (e.g. Google Cloud SQL or Supabase).
2. Execute the `schema.sql` file against your database:
   ```bash
   psql -h <host> -U <username> -d <database_name> -f schema.sql
   ```
3. Set your environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@host:5432/database_name
   ```

### Option B: Docker Container Deployment (File Persistence)

To run the application with full JSON database file persistence in Docker:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
Mount a persistent volume for `/app/src/data` so changes to `database.json` persist across container restarts.

---

## 🔌 Database API Endpoints

The server provides built-in REST management endpoints for database administration:

- **`GET /api/v1/database/info`**
  Returns real-time database status, entity counts, table names, and health info.

- **`GET /api/v1/database/export?format=json`**
  Exports the full application state as a downloadable `database.json` file.

- **`GET /api/v1/database/export?format=sql`** or **`GET /api/v1/database/schema.sql`**
  Serves the raw `schema.sql` file for direct database migrations.

- **`POST /api/v1/database/sync`**
  Triggers an immediate persistent flush of in-memory data to `src/data/database.json`.
