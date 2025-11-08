# 🚀 Employee Management System (EMS)

A full-stack **Employee Management System** built with **React, TypeScript, Supabase, and Vite**, designed for modern organizations to streamline employee operations, leave management, and department hierarchy — including **two-level leave approvals (TL → Manager)**.

---

## 🧠 Overview

This Employee Management System provides an all-in-one platform for managing employees, roles, holidays, and leave workflows. It ensures transparency, proper approval hierarchy, and smooth coordination between **employees, team leads (TLs), and managers (admins)**.

---

## ⚙️ Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React + TypeScript + Vite |
| **UI Components** | ShadCN/UI + Tailwind CSS + Lucide Icons |
| **Backend** | Supabase (Hono server functions + KV storage) |
| **Database** | Supabase KV Store (PostgreSQL JSONB) |
| **Auth** | Supabase Authentication (JWT) |
| **Version Control** | Git + GitHub |

---

## ✨ Core Features

### 👨‍💼 User Roles
- **Employee** – can request leaves, view balances, check holidays.  
- **Team Lead (HOD)** – reviews and approves employee leave requests.  
- **Manager (Admin)** – final approval authority; manages employees, holidays, and system-wide data.

### 🧾 Leave Management
- Employees can apply for leave with date ranges.
- **Two-Level Approval Flow**:
  - Employee → **Team Lead (HOD)** → **Manager (Admin)**.
  - Requests without TL approval never reach the manager.
- Auto-validation for:
  - Insufficient leave balance.
  - Public holidays in requested range.

### 🗓️ Holiday Management
- Admin can add, edit, and delete holidays.
- Supports both **Public** and **Company-specific** holidays.
- Includes table and calendar view.

### 🧍 Employee Management
- Admin can:
  - Add, update, or remove employees.
  - Assign or promote employees to HOD or Admin roles.
  - Track departments and roles centrally.

### 🧩 Authentication
- Secure user registration (employee-only by default).
- Role assignment via **admin-only promote/demote endpoint**.
- Protected API routes with token validation.

### 📊 Dashboards
- Clean dashboards for:
  - Employees – track profile, leaves, holidays.
  - HODs – manage department requests.
  - Admins – oversee all departments, analytics, and system activity.

---

## 🖥️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/bscitsatyamdubey-maker/Employee_Management_System.git
cd Employee_Management_System
