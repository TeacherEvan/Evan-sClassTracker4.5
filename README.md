# Evan's Class Tracker 4.5

Bilingual English/Thai class tracker for teachers and schools - Built with Next.js 15, React 19, Convex & Tailwind v4

## ✨ Recent Optimizations (Oct 2025)

🚀 **Performance Enhancements:**

- **40-50% faster initial load** - Code splitting with lazy loading
- **10-100x faster queries** - Eliminated N+1 database queries via batch fetching
- **Native database pagination** - Efficient handling of 10,000+ records with cursors
- **Rate limiting** - Protection against abuse (20 msgs/min, 30 bookings/min)
- **Input validation** - Security improvements on all user inputs
- **Toast notifications** - Modern, non-blocking bilingual feedback system
- **Index-first queries** - Optimized database access patterns

See [docs/OPTIMIZATION_ANALYSIS_2025.md](docs/OPTIMIZATION_ANALYSIS_2025.md) for details.

## Features

- 🔐 **User Authentication** - Secure login system with role-based access
- 👥 **User Management** - Admin can create and manage teacher, moderator, and admin accounts
- 🔑 **Password Security** - Default password pattern with mandatory password change on first login
- 📅 **Class Booking** - Teachers can book classes with automatic moderator notifications
- ✅ **Approval Workflow** - Moderators acknowledge and approve/reject class bookings
- 👨‍🎓 **Student Management** - Track students with unique auto-generated IDs
- 🔔 **User Notification System** - Real-time alerts and updates
- 🌏 **Bilingual Support** - Full English/Thai language support
- ⚡ **Real-time Updates** - Powered by Convex backend
- 🎨 **Modern UI** - Built with Next.js 15 and Tailwind CSS
- 🌙 **Dark Mode** - Automatic dark mode support
- 🔍 **Advanced Search** - Bilingual search across students, classes, users, and schools
- 📊 **Analytics & Reporting** - Teacher performance metrics, trends, and statistics
- 📄 **Data Export** - CSV/Excel export for classes, students, and analytics
- 🚀 **Bulk Operations** - Import/create multiple students or users at once
- 📑 **Pagination** - Efficient handling of large datasets with pagination support

## User Roles

### Admin

- Create and manage users
- Reset passwords (cannot view passwords)
- Send notifications
- Full system access

### Moderator

- Receive notifications for class bookings at their school
- Acknowledge class bookings
- Approve or reject classes
- View class schedules

### Teacher

- Book classes at schools
- Receive booking status notifications
- View their booking history

## Quick Start

### First Time Setup

1. **Install dependencies**:

```bash
npm install
```

2. **Set up Convex**:

```bash
npx convex dev
```

3. **Run the development server**:

```bash
npm run dev
```

4. **Initialize database**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Click "Initialize Database" button
   - Note the default credentials displayed
   - **⚠️ Change all default passwords after first login!**

### Default Credentials (After Initialization)

- **Admin**: `admin` / `TeacherAdmin`
- **Moderator**: `moderator1` / `TeacherModerator1`
- **Teacher**: `Evan` / `TeacherEvan`

## Key Features Explained

### Password System

When creating a new user (e.g., "Evan"):

- Default password is automatically set to `Teacher{username}` (e.g., `TeacherEvan`)
- User is required to change password on first login
- Admin can only reset passwords, **not view them**
- No minimum password requirements - users can create any password

### Class Booking Workflow

1. Teacher books a class at a school
2. Moderator associated with that school receives automatic notification
3. Moderator must acknowledge the booking
4. Moderator can approve or reject the class
5. Teacher receives notification of the decision

### Student ID Generation

Each student gets a unique identifier in format:

```
{SchoolHash}-{NameHash}-{Timestamp}-{Random}
```

Example: `BANG-EVTH-abc123-XY4Z`

This ensures no duplicates and easy tracking.

## Notification System

The notification system allows administrators and the system to:

- Create notifications in both English and Thai
- Send user-specific or system-wide notifications
- Automatic notifications for class booking events
- View all notifications with automatic language switching
- Mark notifications as read/unread
- Delete individual notifications
- See unread notification counts
- Filter notifications by type (info, success, warning, error)

### Notification Types

- **Info** - General information and announcements
- **Success** - Positive updates and achievements
- **Warning** - Important reminders and alerts (e.g., new class bookings)
- **Error** - Critical issues requiring attention

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Convex (real-time database and API)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Home page with authentication
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── login-form.tsx              # Login interface
│   ├── password-change-dialog.tsx  # Password change modal
│   ├── user-management.tsx         # User CRUD (admin)
│   ├── class-booking.tsx           # Class booking interface
│   ├── database-init.tsx           # Database initialization
│   ├── notification-list.tsx       # Notification display
│   ├── notification-form.tsx       # Create notifications
│   └── language-switcher.tsx       # Language toggle
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   ├── users.ts        # User authentication & management
│   ├── schools.ts      # School management
│   ├── classes.ts      # Class booking & approval
│   ├── students.ts     # Student management
│   ├── notifications.ts # Notification API
│   └── init.ts         # Database initialization
└── lib/                # Utilities
    ├── convex-provider.tsx        # Convex React provider
    └── language-context.tsx       # i18n context
```

## Documentation

- [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md) - Detailed feature documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [FEATURES.md](FEATURES.md) - Original feature specifications

## Development

### User Management

Admins can create users through the Users tab:

1. Enter username (e.g., "Evan")
2. Select role (teacher, moderator, admin)
3. Optionally assign to a school
4. System generates default password: `Teacher{username}`
5. User must change password on first login

### Class Booking

Teachers can book classes through the Classes tab:

1. Fill in class details (English and Thai)
2. Select school
3. Set scheduled date
4. Submit booking
5. Moderator receives notification automatically

### Creating Notifications

Use the notification form on the Notifications tab (admin only). You must provide both English and Thai translations for the title and message.

### Language Switching

Click the language switcher in the top-right corner to toggle between English (EN) and Thai (ไทย).

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your Convex environment variables
4. Deploy!

### Convex Production Setup

```bash
npx convex deploy
```

This will create a production deployment and provide you with the production URL to add to your Vercel environment variables.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
