# Evan's Class Tracker 4.5

Bilingual English/Thai class tracker for teachers and schools - Built with Convex & Vercel

## Features

- 🔔 **User Notification System** - Real-time alerts and updates
- 🌏 **Bilingual Support** - Full English/Thai language support
- ⚡ **Real-time Updates** - Powered by Convex backend
- 🎨 **Modern UI** - Built with Next.js 15 and Tailwind CSS
- 🌙 **Dark Mode** - Automatic dark mode support

## Notification System

The notification system allows teachers and administrators to:

- Create notifications in both English and Thai
- View all notifications with automatic language switching
- Mark notifications as read/unread
- Delete individual notifications
- See unread notification counts
- Filter notifications by type (info, success, warning, error)

### Notification Types

- **Info** - General information and announcements
- **Success** - Positive updates and achievements
- **Warning** - Important reminders and alerts
- **Error** - Critical issues requiring attention

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm or yarn package manager
- Convex account (optional for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TeacherEvan/Evan-sClassTracker4.5.git
cd Evan-sClassTracker4.5
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to existing)
- Generate your `.env.local` file with `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex development server

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

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
│   ├── page.tsx         # Home page with notifications
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── notification-list.tsx      # Notification display
│   ├── notification-form.tsx      # Create notifications
│   └── language-switcher.tsx      # Language toggle
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   └── notifications.ts # Notification API
└── lib/                # Utilities
    ├── convex-provider.tsx        # Convex React provider
    └── language-context.tsx       # i18n context
```

## Development

### Creating Notifications

Use the notification form on the home page to create new notifications. You must provide both English and Thai translations for the title and message.

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

