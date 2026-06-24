# System Architecture - AI Daily Status Assistant

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite + TypeScript + Tailwind + shadcn/ui)      │
│  ├─ Chat Interface (ChatPage)                                   │
│  ├─ Dashboard (Statistics & Charts)                             │
│  ├─ Monthly Reports (Download & History)                        │
│  ├─ Settings (Profile & Preferences)                            │
│  └─ Auth Pages (Login & Register)                               │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS / REST API / JSON
                 │
┌────────────────┴────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Layer (Express Router)                                      │
│  ├─ /api/auth/* - Authentication                                │
│  ├─ /api/chat/* - Chat Messages                                 │
│  ├─ /api/timesheet/* - Timesheet CRUD                           │
│  ├─ /api/report/* - Report Generation                           │
│  └─ /api/dashboard/* - Stats & Charts                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Controllers (Business Logic)                             │   │
│  ├─ AuthController - JWT, password, profile                │   │
│  ├─ ChatController - Session & message handling            │   │
│  ├─ TimesheetController - CRUD & validation                │   │
│  ├─ ReportController - Excel generation                    │   │
│  └─ DashboardController - Aggregations                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Services (Core Features)                                 │   │
│  ├─ AIService (Ollama Integration)                         │   │
│  │  ├─ analyzeStatus() - Extract tasks & hours             │   │
│  │  └─ generateSummary() - Professional summary            │   │
│  ├─ TimesheetService - Business rules                      │   │
│  │  ├─ createEntry() - With AI processing                  │   │
│  │  ├─ detectDuplicate() - Same-day check                  │   │
│  │  └─ getMonthlyData() - Aggregation                      │   │
│  ├─ ReportService - Excel generation                       │   │
│  │  ├─ generateMonthlyReport() - Create Excel              │   │
│  │  └─ formatWorksheet() - Styling & layout                │   │
│  ├─ EmailService - SMTP via Nodemailer                     │   │
│  │  ├─ sendReminderEmail() - Daily at 6 PM                 │   │
│  │  └─ sendMonthlyReport() - With attachment               │   │
│  ├─ AuthService - Security & tokens                        │   │
│  │  ├─ hashPassword() - bcrypt                             │   │
│  │  └─ generateJWT() - Token creation                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Repositories (Database Access)                           │   │
│  ├─ UserRepository                                         │   │
│  ├─ ChatSessionRepository                                  │   │
│  ├─ MessageRepository                                      │   │
│  ├─ DailyStatusRepository                                  │   │
│  ├─ MonthlyReportRepository                                │   │
│  └─ ReminderLogRepository                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Scheduled Jobs (Cron/Node-Cron)                         │   │
│  ├─ ReminderJob - Every day at 6 PM                        │   │
│  │  └─ Check: Has user submitted today?                    │   │
│  │     └─ If NO: Send reminder email                       │   │
│  ├─ ReportJob - Last day of month at 11 PM                │   │
│  │  └─ Generate Excel for all users                        │   │
│  │     └─ Send email with attachment                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Middleware                                                       │
│  ├─ Authentication (JWT verify)                                  │
│  ├─ Error Handling (Global handler)                             │
│  ├─ Validation (Zod schemas)                                     │
│  ├─ Logging (Winston/Pino)                                       │
│  └─ Rate Limiting (express-rate-limit)                           │
│                                                                   │
│  Utils & Helpers                                                 │
│  ├─ Environment variables validation                             │
│  ├─ Database connection pool                                     │
│  ├─ Error formatters                                             │
│  └─ Date/time utilities                                          │
│                                                                   │
└────────────┬──────────────────────────────────┬──────────────────┘
             │                                  │
             │ Prisma ORM + SQL               │ Ollama HTTP
             │ Connection Pool                │ llama3/qwen3/mistral
             │                                  │
┌────────────▼──────────────┐  ┌───────────────▼──────────────┐
│  NEON PostgreSQL          │  │  Ollama AI Engine            │
│  ├─ Users Table           │  │  (Local/Cloud)               │
│  ├─ Chat Sessions         │  │  Model: Configurable         │
│  ├─ Messages              │  │                              │
│  ├─ Daily Status          │  └──────────────────────────────┘
│  ├─ Monthly Reports       │
│  ├─ Reminder Logs         │  ┌──────────────────────────────┐
│  └─ Indexes & Constraints │  │  Gmail SMTP                  │
└───────────────────────────┘  │  (Nodemailer)                │
                                │  ├─ Daily reminders          │
                                │  └─ Monthly reports          │
                                └──────────────────────────────┘
```

## Component Communication Flow

### 1. User Registration Flow
```
Frontend (Register Page)
    ↓
    POST /api/auth/register
    ↓
Backend (AuthController)
    ↓
AuthService.registerUser()
    ├─ Validate input (Zod)
    ├─ Hash password (bcrypt)
    └─ Create user via UserRepository
    ↓
Database (Users Table)
    ↓
Response: JWT token + user data
```

### 2. Daily Status Submission Flow
```
Frontend (Chat Interface)
    ↓
User types: "Fixed bug, attended meeting, worked 6 hours"
    ↓
    POST /api/chat/message
    ├─ Body: { session_id, content }
    ↓
Backend (ChatController)
    ├─ Save user message to Messages table
    ↓
Backend (AIService.analyzeStatus)
    ├─ Send message to Ollama
    ├─ Extract tasks, hours, working_flag
    ├─ Generate professional summary (max 300 chars)
    ↓
Backend (TimesheetService.createEntry)
    ├─ Check for duplicates (same user + today's date)
    ├─ Create DailyStatus record with AI-extracted data
    ├─ Calculate statistics
    ↓
Database (Daily Status Table)
    ├─ Store: user_id, status_text, ai_summary, hours, work_date, working_flag
    ↓
Backend (ChatController)
    ├─ Generate AI response with confirmation
    ├─ Save AI response to Messages table
    ↓
Response: AI confirmation + statistics
    ↓
Frontend
    ├─ Display AI response
    ├─ Update chat UI
    └─ Show success notification
```

### 3. Duplicate Detection Flow
```
User submits status for same day again
    ↓
TimesheetService.detectDuplicate()
    ├─ Query: SELECT * FROM daily_status 
              WHERE user_id = X AND work_date = TODAY
    ├─ If found: Ask user
    │  └─ "Append to today's status or create new entry?"
    ├─ If append: Merge with existing entry
    └─ If new: Create separate entry
```

### 4. Reminder Job Flow (Daily at 6 PM)
```
Node-Cron triggers at 18:00
    ↓
Backend (ReminderJob)
    ├─ Query all active users
    ↓
For each user:
    ├─ Check: Does daily_status exist for TODAY?
    ├─ If NO:
    │  ├─ EmailService.sendReminderEmail()
    │  ├─ Log to Reminder Logs table
    │  └─ Mark status: "sent"
    └─ If YES: Skip (mark "skipped")
    ↓
Email (Gmail SMTP via Nodemailer)
    ├─ Subject: "Daily Status Reminder"
    ├─ Body: Personalized message with user name
    ├─ Recipient: User email from Users table
```

### 5. Monthly Report Generation Flow (Last day of month at 11 PM)
```
Node-Cron triggers on last day at 23:00
    ↓
Backend (ReportJob)
    ├─ Query all active users
    ↓
For each user:
    ├─ TimesheetService.getMonthlyData()
    │  └─ Query: daily_status WHERE user_id = X AND MONTH(work_date) = current_month
    │
    ├─ ReportService.generateMonthlyReport()
    │  ├─ Create Excel workbook (ExcelJS)
    │  ├─ Add header row: [Date | Day | Name | Master No | Description | Hours | Working]
    │  ├─ Format header (bold, centered, background)
    │  ├─ Add data rows from monthly entries
    │  ├─ Add totals row
    │  │  ├─ Total Working Days: COUNT(working_flag = true)
    │  │  ├─ Total Hours: SUM(hours)
    │  │  └─ Average Hours: AVG(hours)
    │  ├─ Auto-size columns
    │  └─ Save file to storage (local/S3)
    │
    ├─ MonthlyReportRepository.create()
    │  └─ Store: user_id, month, year, file_path
    │
    ├─ EmailService.sendMonthlyReport()
    │  ├─ Subject: "Monthly Timesheet Report - June 2026"
    │  ├─ Body: Personalized message
    │  ├─ Attachment: Generated Excel file
    │  └─ Recipient: User email
    │
    ├─ Update Monthly Reports table
    │  └─ Mark: email_sent = true
    │
    └─ Log: "Report generated and sent successfully"
```

### 6. Dashboard Data Flow
```
Frontend (Dashboard Page)
    ↓
    GET /api/dashboard/stats
    ↓
Backend (DashboardController)
    ├─ DashboardService.getStatistics(user_id)
    │  ├─ Total Working Days: COUNT WHERE working_flag = true (current month)
    │  ├─ Total Hours: SUM(hours) (current month)
    │  ├─ Missing Days: Days in month - working days
    │  ├─ Current Month Entries: COUNT (current month)
    │  └─ Average Hours: AVG(hours) (current month)
    │
    └─ Return JSON: { total_days, total_hours, missing_days, entries, avg_hours }
    
    GET /api/dashboard/charts
    ↓
Backend (DashboardController)
    ├─ DashboardService.getChartData(user_id)
    │  ├─ Monthly Hours: [{ month, hours }, ...]
    │  ├─ Daily Trend: [{ date, hours }, ...]
    │  └─ Task Categories: [{ category, count }, ...]
    │
    └─ Return JSON: { monthly, daily, categories }

Frontend
    ├─ Display statistics cards
    ├─ Render charts using Recharts
    └─ Update on page load and periodically
```

## Data Flow Patterns

### Request/Response Pattern
```
Frontend Request
    ↓
Express Route Handler
    ↓
JWT Middleware (Verify token)
    ↓
Validation Middleware (Zod schema)
    ↓
Controller
    ↓
Service (Business logic)
    ↓
Repository (Database query)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Response: Data/Error
    ↓
Error Middleware (Format errors)
    ↓
Frontend Response
```

### Async Job Pattern
```
Scheduled Trigger (Node-Cron)
    ↓
Job Executor
    ↓
Query Data (Repository)
    ↓
Process Data (Service)
    ↓
External Service (Email/Storage)
    ↓
Log Result (Database)
    ↓
Complete
```

## Technology Layers

### Presentation Layer
- React components
- State management (Zustand)
- Routing (React Router)
- UI Framework (shadcn/ui)

### API Layer
- Express routes
- Request validation
- Response formatting
- Error handling

### Business Logic Layer
- Controllers
- Services (AI, Timesheet, Report, Email)
- Scheduled jobs

### Data Access Layer
- Repositories (Database abstraction)
- Prisma ORM
- Connection pooling

### External Integrations
- Ollama (AI)
- Gmail SMTP (Email)
- PostgreSQL (Database)
- File storage (Local or S3)

## Security Architecture

```
┌─────────────────────────────────────────┐
│ Frontend                                 │
│ ├─ HttpOnly cookies for JWT             │
│ ├─ CORS origin check                    │
│ └─ Input sanitization                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ HTTPS/TLS Encryption                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Backend Middleware                       │
│ ├─ Helmet (Security headers)            │
│ ├─ CORS policy                          │
│ ├─ Rate limiting                        │
│ ├─ Request logging                      │
│ └─ JWT verification                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Application Layer                        │
│ ├─ Zod input validation                 │
│ ├─ Business logic validation            │
│ ├─ Authorization checks                 │
│ └─ Error handling                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Database Layer                           │
│ ├─ Parameterized queries (Prisma)       │
│ ├─ Connection pooling                   │
│ ├─ Role-based access control            │
│ └─ Encryption at rest                   │
└──────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────┐
│ GitHub Repository                 │
│ ├─ Frontend branch                │
│ └─ Backend branch                 │
└────┬──────────────────────┬───────┘
     │                      │
     │ git push             │ git push
     │                      │
┌────▼──────────────┐  ┌───▼──────────────┐
│ Vercel            │  │ Render           │
│ ├─ Auto-deploy    │  │ ├─ Auto-deploy   │
│ ├─ Build          │  │ ├─ Build         │
│ ├─ Test           │  │ ├─ Test          │
│ └─ Frontend Live  │  │ └─ Backend Live  │
└────┬──────────────┘  └───┬──────────────┘
     │                      │
     └──────────┬───────────┘
                │ HTTP/HTTPS
         ┌──────▼──────────┐
         │ Neon PostgreSQL  │
         │ ├─ Database      │
         │ ├─ Backups       │
         │ └─ Replication   │
         └─────────────────┘
```

## Performance Considerations

1. **Database Indexing**
   - Index on: user_id, work_date (Daily Status table)
   - Index on: user_id (Users, Reports table)
   - Index on: session_id (Messages table)

2. **Caching Strategy**
   - Cache user profile (5 min TTL)
   - Cache dashboard stats (1 hour TTL)
   - Cache monthly data (until end of month)

3. **Query Optimization**
   - Batch queries where possible
   - Use Prisma includes for relations
   - Limit query results with pagination

4. **Async Processing**
   - Emails sent asynchronously
   - Reports generated in background jobs
   - File uploads done asynchronously

5. **Frontend Optimization**
   - Code splitting per route
   - Lazy load components
   - Memoize expensive computations
   - Virtualize long lists

## Monitoring & Observability

- Application logs (Winston/Pino)
- API response time tracking
- Database query performance
- Job execution logs
- Error rate monitoring
- Uptime monitoring (Vercel, Render)
- User analytics (optional)

## Backup & Disaster Recovery

- Daily database backups (Neon automatic)
- File backup strategy for generated reports
- Error logging for debugging
- Health checks on all services
- Rollback strategy for deployments
