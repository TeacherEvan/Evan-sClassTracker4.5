# System Architecture Diagram - Evan's Class Tracker 4.5

**Date**: November 2, 2025  
**Version**: 4.5.20 (PBKDF2 Security)  
**Purpose**: Visual reference for system architecture, data flow, and deployment

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer - Browser"
        UI[React Components<br/>Next.js 15 App Router]
        Session[Session Storage<br/>localStorage + 24hr expiry]
        Toast[Toast Notifications<br/>Real-time UI feedback]
    end

    subgraph "Provider Hierarchy - CRITICAL ORDER"
        EB[ErrorBoundary<br/>Global error handling]
        CCP[ConvexClientProvider<br/>WebSocket connection]
        DP[DeviceProvider<br/>Desktop/Mobile/Tablet]
        DataP[DataProvider<br/>Shared data cache]
        LP[LanguageProvider<br/>EN/TH bilingual]
    end

    subgraph "Backend Layer - Convex Cloud"
        Queries[Queries<br/>Read operations + subscriptions]
        Mutations[Mutations<br/>Write operations + validation]
        Actions[Actions<br/>External API calls]
        RateLimit[Rate Limiting<br/>30/min bookings, 20/min messages]
    end

    subgraph "Database Layer - Convex DB"
        Schema[Schema.ts<br/>Source of truth]
        Indexes[Indexes<br/>Performance optimization]
        Tables[(Tables:<br/>users, classes, students,<br/>schools, locations, etc.)]
    end

    subgraph "Security Layer"
        Auth[Custom Auth<br/>Session-based]
        PBKDF2[PBKDF2 Hashing<br/>100K iterations, SHA-256]
        RBAC[Role-Based Access<br/>Admin/Moderator/Teacher/Guardian]
    end

    UI --> EB
    EB --> CCP
    CCP --> DP
    DP --> DataP
    DataP --> LP
    LP --> UI

    CCP <-->|WebSocket| Queries
    CCP <-->|WebSocket| Mutations
    CCP --> Actions

    Queries --> RateLimit
    Mutations --> RateLimit
    RateLimit --> Schema
    Schema --> Indexes
    Indexes --> Tables

    Session --> Auth
    Auth --> PBKDF2
    PBKDF2 --> RBAC
    RBAC --> Mutations

    style EB fill:#ff6b6b
    style CCP fill:#4ecdc4
    style PBKDF2 fill:#95e1d3
    style Schema fill:#ffeaa7
```

---

## 2. Authentication & Security Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant Session as Session Utils<br/>(localStorage)
    participant Convex as Convex Backend
    participant PBKDF2 as PBKDF2 Hasher<br/>(100K iterations)
    participant DB as Database

    User->>LoginForm: Enter username/password
    LoginForm->>Convex: Login mutation
    Convex->>DB: Query user by username<br/>(indexed: by_username)
    DB-->>Convex: User record + passwordHash
    
    alt Account Locked
        Convex->>Convex: Check accountLockedUntil > now
        Convex-->>LoginForm: Error: Account locked (24hr)
        LoginForm-->>User: Show error toast
    else Account Active
        Convex->>PBKDF2: Verify password
        PBKDF2->>PBKDF2: Check hash format<br/>(pbkdf2$ / bcrypt / btoa)
        
        alt PBKDF2 Hash (New)
            PBKDF2->>PBKDF2: Extract salt + hash
            PBKDF2->>PBKDF2: Hash input with salt<br/>(100K iterations)
            PBKDF2-->>Convex: Match result
        else bcrypt Hash (Legacy)
            PBKDF2->>PBKDF2: bcrypt.compare()
            PBKDF2-->>Convex: Match result
            Note over Convex,DB: Auto-upgrade to PBKDF2<br/>on next password change
        else btoa Hash (Legacy)
            PBKDF2->>PBKDF2: Base64 decode + compare
            PBKDF2-->>Convex: Match result
            Note over Convex,DB: Auto-upgrade to PBKDF2<br/>on next password change
        end
        
        alt Password Correct
            Convex->>DB: Update failedLoginAttempts = 0<br/>lastSuccessfulLogin = now
            Convex-->>LoginForm: Return user object
            LoginForm->>Session: saveUserSession(user)<br/>expiresAt = now + 24hrs
            Session-->>User: Redirect to dashboard
        else Password Incorrect
            Convex->>DB: Increment failedLoginAttempts
            alt Failed Attempts >= 5
                Convex->>DB: Set accountLockedUntil<br/>= now + 24hrs
                Convex-->>LoginForm: Error: Account locked
            else Failed Attempts < 5
                Convex-->>LoginForm: Error: Invalid password
            end
            LoginForm-->>User: Show error toast
        end
    end
```

---

## 3. Class Booking Data Flow

```mermaid
sequenceDiagram
    participant Teacher
    participant BookingUI as Class Booking UI
    participant ConflictDetector as Conflict Detector
    participant Convex as Convex Backend
    participant DB as Database
    participant Moderator
    participant NotificationUI as Notification UI

    Teacher->>BookingUI: Select school, student, date, time
    BookingUI->>ConflictDetector: Check for conflicts
    ConflictDetector->>Convex: Query existing classes<br/>(indexed: by_teacher_and_date)
    Convex->>DB: Get classes for date range
    DB-->>Convex: Existing classes
    Convex-->>ConflictDetector: Classes data
    ConflictDetector->>ConflictDetector: Check time overlaps
    
    alt Has Conflicts
        ConflictDetector-->>BookingUI: Show conflict warning
        BookingUI-->>Teacher: Display conflicts<br/>(yellow warning banner)
        Teacher->>BookingUI: Review + confirm override
    else No Conflicts
        ConflictDetector-->>BookingUI: Clear to proceed
    end
    
    Teacher->>BookingUI: Click "Book Class"
    BookingUI->>Convex: classes.book mutation
    
    Convex->>Convex: Rate limit check<br/>(30 bookings/min)
    Convex->>Convex: Validate inputs<br/>(date, time, student, etc.)
    
    alt Guardian-Linked Class
        Convex->>DB: Insert class<br/>status = "approved"<br/>isGuardianLinked = true
        Convex-->>BookingUI: Success (auto-approved)
    else Regular Class (School)
        Convex->>DB: Insert class<br/>status = "pending"
        Convex->>DB: Create notification for moderator
        Convex-->>BookingUI: Success (pending approval)
        
        Note over Moderator,NotificationUI: Real-time subscription
        DB-->>NotificationUI: New notification event
        NotificationUI->>Moderator: Show unread badge + toast
        
        Moderator->>NotificationUI: Click notification
        NotificationUI->>Moderator: Show class details
        Moderator->>Convex: Approve/Reject mutation
        Convex->>DB: Update status = "approved"/"rejected"
        Convex->>DB: Create notification for teacher
        DB-->>BookingUI: Real-time update
        BookingUI-->>Teacher: Show updated status
    end
```

---

## 4. Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ CLASSES : teaches
    USERS ||--o{ CLASSES : moderates
    STUDENTS ||--o{ CLASSES : attends
    SCHOOLS ||--o{ USERS : employs
    SCHOOLS ||--o{ CLASSES : hosts
    SCHOOLS ||--o{ STUDENTS : enrolls
    SCHOOLS ||--o{ LOCATIONS : owns
    PROVIDERS ||--o{ CLASSES : hosts
    PROVIDERS ||--o{ STUDENTS : enrolls
    LOCATIONS ||--o{ CLASSES : "held at"
    CLASSES ||--o{ NOTIFICATIONS : generates
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ TEACHER_CLASS_COUNT_CYCLES : tracks

    USERS {
        string _id PK
        string username UK
        string passwordHash "PBKDF2 hash"
        string role "admin/moderator/teacher/guardian"
        Id schoolId FK "NULL for guardians"
        number failedLoginAttempts
        number accountLockedUntil
        number lastSuccessfulLogin
        string deviceType "desktop/mobile/tablet"
    }

    CLASSES {
        string _id PK
        Id teacherId FK
        Id studentId FK
        Id schoolId FK "NULL for provider classes"
        Id providerId FK "NULL for school classes"
        Id locationId FK
        string status "pending/acknowledged/approved/rejected"
        number scheduledDate
        string startTime
        string endTime
        boolean isGuardianLinked
        boolean attended
        number classCount
    }

    STUDENTS {
        string _id PK
        string studentId UK "Generated ID"
        string firstName
        string lastName
        Id schoolId FK "NULL for guardian students"
        Id guardianId FK "NULL for school students"
        string area "For guardian students"
        number dateOfBirth "For guardian students"
    }

    SCHOOLS {
        string _id PK
        string name
        string nameTh
        Id moderatorId FK
        array grades
    }

    PROVIDERS {
        string _id PK
        string name
        string nameTh
        string category "personal/private/language_school/educational_camp"
        Id createdBy FK
    }

    LOCATIONS {
        string _id PK
        string name
        string nameTh
        Id schoolId FK
        boolean isActive
    }

    NOTIFICATIONS {
        string _id PK
        Id recipientId FK
        string type
        string message
        string messageTh
        boolean isRead
        number createdAt
    }

    MESSAGES {
        string _id PK
        Id senderId FK
        array recipientIds
        string subject
        string body
        Id attachmentStorageId "Convex Storage"
        array acknowledgedBy
    }

    TEACHER_CLASS_COUNT_CYCLES {
        string _id PK
        Id teacherId FK
        number cycleStartDate
        number cycleEndDate
        boolean isActive
        Id createdBy FK
    }
```

---

## 5. Real-Time Subscription Pattern

```mermaid
sequenceDiagram
    participant Component
    participant useQuery as useQuery Hook
    participant Convex as Convex Client
    participant Backend as Convex Backend
    participant DB as Database
    participant OtherUser as Other User's Browser

    Component->>useQuery: useQuery(api.classes.list, {schoolId})
    useQuery->>Convex: Subscribe to query
    Convex->>Backend: WebSocket: Subscribe
    Backend->>DB: Execute query + watch for changes
    DB-->>Backend: Initial results
    Backend-->>Convex: WebSocket: Query results
    Convex-->>useQuery: Update state
    useQuery-->>Component: Re-render with data

    Note over OtherUser,DB: Another user creates a class
    OtherUser->>Backend: classes.book mutation
    Backend->>DB: Insert class record
    DB->>DB: Detect change in subscribed query
    DB-->>Backend: Change notification
    Backend-->>Convex: WebSocket: Updated results
    Convex-->>useQuery: Update state
    useQuery-->>Component: Re-render (real-time update!)
    Component->>Component: Show toast notification<br/>"New class added"
```

---

## 6. Deployment Pipeline

```mermaid
graph LR
    subgraph "Development - Local"
        Dev[Developer]
        Git[Git Repository<br/>GitHub]
        LocalConvex[Convex Dev<br/>npx convex dev]
        LocalNext[Next.js Dev<br/>npm run dev]
    end

    subgraph "CI/CD - GitHub Actions"
        Push[Git Push]
        CI[CI Workflow<br/>TypeScript + ESLint]
        E2E[E2E Tests<br/>Playwright]
        Deploy[Deploy Workflow]
    end

    subgraph "Production - Cloud"
        ConvexProd[Convex Cloud<br/>Backend + Database]
        VercelProd[Vercel<br/>Next.js Frontend]
        CDN[Vercel CDN<br/>Global Edge Network]
    end

    subgraph "Backup - MongoDB Atlas"
        Backup[Daily Backups<br/>npm run backup]
        MongoAtlas[(MongoDB Atlas<br/>Secondary storage)]
    end

    Dev -->|Code changes| Git
    Git -->|Webhook| Push
    Push --> CI
    CI -->|Pass| E2E
    E2E -->|Pass| Deploy

    Deploy -->|npx convex deploy| ConvexProd
    Deploy -->|vercel --prod| VercelProd
    VercelProd --> CDN
    CDN -->|HTTPS| Users[End Users]

    ConvexProd <-->|Real-time WebSocket| CDN
    ConvexProd -->|Daily export| Backup
    Backup --> MongoAtlas

    Dev -->|Local dev| LocalConvex
    Dev -->|Local dev| LocalNext
    LocalNext <-->|WebSocket| LocalConvex

    style ConvexProd fill:#4ecdc4
    style VercelProd fill:#000
    style MongoAtlas fill:#00ed64
```

---

## 7. Performance Optimization Patterns

```mermaid
graph TB
    subgraph "Query Optimization"
        Query[Database Query]
        Index[Check Index<br/>by_teacher_and_date]
        Batch[Batch Fetch Pattern<br/>Promise.all]
        Map[Map Lookup<br/>O1 access]
    end

    subgraph "Frontend Optimization"
        Component[React Component]
        Memo[useMemo<br/>Expensive calculations]
        Callback[useCallback<br/>Stable functions]
        Debounce[Debounce<br/>300ms input delay]
        Pagination[Pagination<br/>15 items per page]
    end

    subgraph "Network Optimization"
        RealTime[Real-time Updates<br/>WebSocket]
        Cache[DataProvider Cache<br/>Shared state]
        Skip[Conditional Queries<br/>"skip" parameter]
    end

    Query --> Index
    Index --> Batch
    Batch --> Map
    Map -->|Fast lookups| Component

    Component --> Memo
    Component --> Callback
    Component --> Debounce
    Component --> Pagination

    RealTime --> Cache
    Cache --> Skip
    Skip -->|Prevents unnecessary queries| Query

    style Index fill:#95e1d3
    style Map fill:#95e1d3
    style Pagination fill:#95e1d3
    style Cache fill:#95e1d3
```

**Performance Gains** (Oct 2025 optimizations):

- 40-50% faster page loads
- 10-100x faster queries (N+1 elimination)
- 85% DOM reduction (pagination)
- 64% memory reduction

---

## 8. Security Layers

```mermaid
graph TB
    subgraph "Authentication Layer"
        Login[Login Form]
        Session[Session Storage<br/>24hr expiry]
        PBKDF2[PBKDF2 Hashing<br/>100K iterations]
        Lockout[Account Lockout<br/>5 attempts = 24hr]
    end

    subgraph "Authorization Layer"
        RBAC[Role-Based Access]
        Admin[Admin: God Mode<br/>All schools]
        Moderator[Moderator: School-Scoped<br/>Single school only]
        Teacher[Teacher: Multi-School<br/>Any school]
        Guardian[Guardian: Private<br/>Own students only]
    end

    subgraph "Data Protection Layer"
        RateLimit[Rate Limiting<br/>30/min bookings]
        Validation[Input Validation<br/>Mutations]
        Audit[Audit Logging<br/>Admin actions]
        SoftDelete[Soft Deletes<br/>isActive flag]
    end

    subgraph "Security Monitoring"
        ErrorReports[Error Reports<br/>Admin dashboard]
        AuditLogs[Audit Logs<br/>CSV export]
        ConvexLogs[Convex Logs<br/>Real-time monitoring]
    end

    Login --> Session
    Session --> PBKDF2
    PBKDF2 --> Lockout
    Lockout --> RBAC

    RBAC --> Admin
    RBAC --> Moderator
    RBAC --> Teacher
    RBAC --> Guardian

    Admin --> RateLimit
    Moderator --> RateLimit
    Teacher --> RateLimit
    Guardian --> RateLimit

    RateLimit --> Validation
    Validation --> Audit
    Audit --> SoftDelete

    SoftDelete --> ErrorReports
    SoftDelete --> AuditLogs
    SoftDelete --> ConvexLogs

    style PBKDF2 fill:#95e1d3
    style Lockout fill:#95e1d3
    style RateLimit fill:#95e1d3
    style Audit fill:#95e1d3
```

**Security Grade**: A+ (PBKDF2 100K iterations across all password creation)

---

## 9. Bilingual Architecture

```mermaid
graph LR
    subgraph "Schema Layer"
        DB[(Database)]
        NameEN[name field]
        NameTH[nameTh field]
    end

    subgraph "Backend Layer"
        Query[Query Response]
        Both[Return both EN/TH]
    end

    subgraph "Context Layer"
        LP[LanguageProvider]
        State[language state<br/>en or th]
        TFunc[t function<br/>Helper]
    end

    subgraph "UI Layer"
        Component[Component]
        Display[Display text<br/>Based on language]
        BiInput[BilingualInput<br/>Reusable component]
    end

    DB --> NameEN
    DB --> NameTH
    NameEN --> Both
    NameTH --> Both
    Both --> Query

    Query --> LP
    LP --> State
    State --> TFunc
    TFunc --> Component

    Component --> Display
    Component --> BiInput
    BiInput -->|Parallel inputs| Component

    style LP fill:#ffeaa7
    style BiInput fill:#ffeaa7
```

**Pattern**: Every user-facing string has English + Thai. Forms use `BilingualInput` component.

---

## 10. Provider System (NEW Oct 2025)

```mermaid
graph TB
    subgraph "Entity Types"
        School[Schools<br/>Traditional education]
        Provider[Providers<br/>Private tutoring/camps]
    end

    subgraph "XOR Validation"
        Student[Student]
        Class[Class]
        SchoolID{Has schoolId?}
        ProviderID{Has providerId?}
    end

    subgraph "Auto-Approval Flow"
        Guardian[Guardian-Linked<br/>isGuardianLinked = true]
        ProviderClass[Provider Class<br/>providerId != null]
        AutoApprove[Auto-Approve<br/>status = approved]
        ModeratorFlow[Moderator Flow<br/>status = pending]
    end

    School --> SchoolID
    Provider --> ProviderID

    Student --> SchoolID
    Student --> ProviderID
    Class --> SchoolID
    Class --> ProviderID

    SchoolID -->|Yes| ModeratorFlow
    ProviderID -->|Yes| AutoApprove
    SchoolID -->|No, check provider| ProviderID
    ProviderID -->|No, check guardian| Guardian

    Guardian -->|Yes| AutoApprove
    Guardian -->|No| ModeratorFlow

    ProviderClass --> AutoApprove

    style SchoolID fill:#ffeaa7
    style ProviderID fill:#ffeaa7
    style AutoApprove fill:#95e1d3
```

**Rule**: Students/Classes must have EITHER `schoolId` OR `providerId` (not both, not neither).

---

## Legend

| Color | Meaning |
|-------|---------|
| 🔴 Red | Critical/Error handling |
| 🔵 Blue | Data layer/Database |
| 🟢 Green | Security/Performance |
| 🟡 Yellow | UI/Context layer |
| ⚫ Black | External services |

---

## Related Documentation

- **Architecture Details**: `.github/copilot-docs/02-architecture.md`
- **Integration Points**: `.github/copilot-docs/04-integration.md`
- **Security**: `.github/copilot-docs/05-security.md`
- **Disaster Recovery**: `.github/copilot-docs/11-disaster-recovery.md`
- **Refactoring Guide**: `.github/copilot-docs/15-refactoring-guide.md`

---

**Last Updated**: November 2, 2025 (v4.5.20 - PBKDF2 Security)
