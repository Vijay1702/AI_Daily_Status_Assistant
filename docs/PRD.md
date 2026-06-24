# AI Daily Status Assistant - Product Requirements Document

## Executive Summary
A ChatGPT-like application that converts conversational daily work updates into structured timesheet records, automatically stores them in a database, sends reminder emails, and generates monthly Excel reports.

## Problem Statement
Employees currently spend time manually filling out Excel timesheets with repetitive data entry. This is time-consuming, error-prone, and breaks workflow.

## Solution Overview
Replace manual timesheet updates with a conversational AI chat interface where users naturally describe their daily work, and the system automatically:
- Understands and processes status updates
- Creates professional timesheet entries
- Stores data in a database
- Generates monthly Excel reports
- Sends reminder emails for missed updates

## Core Features

### 1. Onboarding (First Login)
- AI asks for name, master number, email, and working hours
- Data stored permanently in user profile
- Setup completion confirmation

### 2. Daily Chat Interface
- ChatGPT-like conversational UI
- User messages and AI responses
- Auto-scroll and markdown support
- Enter to send, Shift+Enter for new line
- Loading animations

### 3. AI Processing
- Analyze work descriptions
- Extract key tasks
- Generate professional summaries (max 300 chars)
- Estimate hours (or use default 8 hours)
- Detect duplicate submissions

### 4. Timesheet Management
Columns: Date | Day | Name | Master No | Description | Hours | Working (Y/N)
- Store daily entries in database
- Edit/delete existing entries
- Monthly aggregation

### 5. Dashboard
- Total working days
- Total hours worked
- Missing days count
- Current month entries
- Average hours per day
- Monthly hours chart (Recharts)
- Daily status trend
- Task category breakdown

### 6. Monthly Reports
- Auto-generated on last day of month
- Excel file with formatted headers and totals
- Email sent to user with attachment
- Report history tracking

### 7. Reminder System
- Daily reminder at 6 PM
- Email if status not submitted
- Customizable reminder time in settings

### 8. Settings Page
- Update name, master number, email
- Adjust daily working hours
- Select preferred AI model (llama3, qwen3, mistral)
- Change reminder time

## User Journey

### Day 1: First Login
1. User opens application
2. AI asks: Name? → Master Number? → Email? → Working Hours?
3. Data saved
4. Setup complete message

### Daily Usage (Day 2+)
1. User opens chat
2. Types: "Worked on merchant portal bug fixes, attended standup, created API"
3. AI processes and shows summary
4. System creates timesheet entry
5. Confirmation displayed

### Monthly Workflow
1. On last day of month: System generates Excel report
2. User receives email with attachment
3. Can view report history anytime

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for bundling
- Tailwind CSS for styling
- shadcn/ui for components
- React Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- Recharts for visualizations

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- JWT authentication
- Bcrypt for passwords
- Zod for validation
- Nodemailer for emails
- ExcelJS for Excel generation

### Database
- Neon PostgreSQL
- Prisma for ORM

### AI Engine
- Ollama (llama3, qwen3, mistral)
- Switchable via environment variables

### Email
- Gmail SMTP with Nodemailer

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

## Database Schema

### Users Table
- id (UUID)
- name (String)
- master_no (String, unique)
- email (String, unique)
- password_hash (String)
- daily_hours (Int, default: 8)
- preferred_model (String, default: "llama3")
- reminder_time (String, default: "18:00")
- created_at (DateTime)
- updated_at (DateTime)

### Chat Sessions Table
- id (UUID)
- user_id (UUID, foreign key)
- session_title (String)
- created_at (DateTime)

### Messages Table
- id (UUID)
- session_id (UUID, foreign key)
- role (String: "user" | "assistant")
- content (String)
- created_at (DateTime)

### Daily Status Table
- id (UUID)
- user_id (UUID, foreign key)
- status_text (String)
- ai_summary (String)
- hours (Int)
- work_date (Date)
- working_flag (Boolean)
- created_at (DateTime)
- updated_at (DateTime)
- Unique constraint: (user_id, work_date)

### Monthly Reports Table
- id (UUID)
- user_id (UUID, foreign key)
- month (Int)
- year (Int)
- file_path (String)
- email_sent (Boolean)
- created_at (DateTime)

### Reminder Logs Table
- id (UUID)
- user_id (UUID, foreign key)
- reminder_date (Date)
- status (String: "sent" | "skipped")
- created_at (DateTime)

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/profile - Get user profile

### Chat
- POST /api/chat/message - Send chat message
- GET /api/chat/history - Get chat history
- GET /api/chat/sessions - Get all sessions
- DELETE /api/chat/session/:id - Delete session

### Timesheet
- POST /api/timesheet - Create entry
- GET /api/timesheet - Get entries
- GET /api/timesheet/monthly - Get monthly entries
- PUT /api/timesheet/:id - Update entry
- DELETE /api/timesheet/:id - Delete entry

### Reports
- POST /api/report/generate - Generate monthly report
- GET /api/report/download/:id - Download report file
- GET /api/report/history - Get report history

### Dashboard
- GET /api/dashboard/stats - Get statistics
- GET /api/dashboard/charts - Get chart data

## Security Requirements
- JWT authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation using Zod
- CORS protection
- Helmet for security headers
- Environment variables for secrets
- SQL injection prevention via Prisma
- XSS protection via React

## Performance Requirements
- Page load time < 3 seconds
- API response time < 500ms
- Support 1000+ concurrent users
- Efficient database queries with indexing

## Scalability Requirements
- Horizontal scaling via Render
- Database connection pooling
- Caching for frequently accessed data
- Message queue for async tasks (emails, reports)

## Deployment Strategy
1. Frontend: Vercel (auto-deploy on git push)
2. Backend: Render (auto-deploy on git push)
3. Database: Neon PostgreSQL with backups
4. CI/CD: GitHub Actions

## Success Metrics
- User adoption rate
- Time saved vs manual entry
- Accuracy of AI-generated summaries
- Email delivery rate
- Report generation success rate
- System uptime > 99.9%

## Milestones
1. Week 1: Backend setup, database, authentication
2. Week 2: AI integration, chat API, processing logic
3. Week 3: Frontend chat interface, dashboard
4. Week 4: Reports, reminders, email integration
5. Week 5: Testing, optimization, deployment

## Future Enhancements
- Bulk import from existing timesheets
- Integrations with Jira, GitHub
- Advanced analytics and burndown charts
- Mobile app
- Voice input for status updates
- Team-level reporting
- Multi-language support
