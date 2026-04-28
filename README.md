# 📚 NextGen Library Management System

A high-performance, fully modular, and responsive Library Management System (LMS) built for modern educational institutions. It seamlessly manages book inventories, student records, issue/return cycles, fine calculations, and role-based staff access.

## ✨ Key Features

- **Role-Based Access Control (RBAC):** Separate dashboards and permissions for Directors/Managers and Librarians.
- **Smart Hardware Integration:** Built-in QR Code and Barcode scanner for quick book checkouts and student identification using device cameras.
- **Real-Time Data Sync:** Powered by Supabase for instant updates across all devices.
- **Automated Fine Calculations:** Dynamic fine tracking based on due dates and customizable fine rates.
- **Digital Library Cards:** Auto-generated digital ID cards for students with embedded QR codes.
- **Communication & Alerts:** Quick Notification system for due date reminders, overdue notices, and fine receipts.
- **Customizable UI/UX:** Dark/Light mode support with dynamic school branding (custom logos, names, and color accents).
- **Data Export & Import:** Bulk upload students via CSV and export comprehensive library reports.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Backend & Database:** Supabase (PostgreSQL, Auth)
- **Scanning Engine:** @zxing/browser
- **Barcode/QR Gen:** jsbarcode, qrcode

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine. You will also need a Supabase project.

### Installation

1. **Clone the repository:**
   `ash
   git clone https://github.com/Manish-bgl/school-library.git
   cd school-library
   `

2. **Install dependencies:**
   `ash
   npm install
   `

3. **Environment Setup:**
   Create a .env file in the root directory and add your Supabase credentials:
   `env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   `

4. **Run the development server:**
   `ash
   npm run dev
   `

5. **Build for production:**
   `ash
   npm run build
   `

## 📂 Project Structure (Modular Architecture)
The application has been refactored for high maintainability:
- /src/components/auth/ - Registration & Login flows.
- /src/components/layout/ - Sidebar and main structural components.
- /src/components/student/ - Student dashboard and digital card views.
- /src/components/ui/ - Reusable UI components (Modals, Forms, Badges, etc.).
- /src/utils/ - Constants, helper functions, and database mappers.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is licensed under the MIT License.
