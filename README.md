# ALX Polly: A Secure Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project demonstrates modern web development practices with a focus on security, user experience, and maintainable code architecture.

## 🚀 Project Overview

ALX Polly is a comprehensive polling platform that allows users to create, share, and vote on polls. The application features a modern tech stack with robust security measures and an intuitive user interface.

### Key Features

- **🔐 Secure Authentication**: User registration, login, and session management
- **📊 Poll Management**: Create, edit, delete, and view polls
- **🗳️ Voting System**: Real-time voting with duplicate prevention
- **👤 User Dashboard**: Personalized poll management interface
- **🛡️ Security First**: Comprehensive security audit and fixes
- **📱 Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Server Components + Client Components

### Backend & Database
- **Backend**: [Supabase](https://supabase.io/)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime (for future features)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Code Formatting**: Prettier

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20.x or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.io/) account

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alx-polly
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Configuration

#### Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

#### Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL script to set up the database schema:

```sql
-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  options TEXT[] NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create their own polls" ON polls FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own polls" ON polls FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own polls" ON polls FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🎯 Usage Examples

### Creating a Poll

1. **Navigate to Create Poll**: Click "Create Poll" in the navigation
2. **Enter Poll Details**:
   - Poll Question: "What's your favorite programming language?"
   - Options: "JavaScript", "Python", "Java", "C#"
3. **Submit**: Click "Create Poll" to save

### Voting on a Poll

1. **Access Poll**: Click on any poll from the polls list
2. **Select Option**: Click on your preferred option
3. **Submit Vote**: Click "Submit Vote"
4. **View Results**: See real-time vote counts and percentages

### Managing Your Polls

1. **View Your Polls**: Navigate to "My Polls" in the dashboard
2. **Edit Poll**: Click "Edit" on any of your polls
3. **Delete Poll**: Click "Delete" to remove a poll (soft delete)
4. **Share Poll**: Copy the poll URL to share with others

## 🧪 Testing the Application

### Manual Testing Checklist

#### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Logout clears session
- [ ] Protected routes redirect to login

#### Poll Management
- [ ] Create poll with valid data
- [ ] Create poll with invalid data (should show errors)
- [ ] Edit poll (only owner can edit)
- [ ] Delete poll (only owner can delete)
- [ ] View poll details

#### Voting System
- [ ] Vote on poll successfully
- [ ] Prevent duplicate voting
- [ ] Vote counts display correctly
- [ ] Anonymous voting works

#### Security
- [ ] Cannot access other users' polls for editing/deleting
- [ ] Input validation works
- [ ] Error messages don't expose sensitive information

### Running Tests

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build the application
npm run build
```

## 🔒 Security Features

This application implements comprehensive security measures:

### Authentication & Authorization
- **Server-side validation** for all operations
- **Row Level Security (RLS)** in the database
- **Ownership validation** for poll operations
- **Session management** with secure cookies

### Input Validation
- **Length limits** on all text inputs
- **Duplicate prevention** for poll options
- **SQL injection protection** via Supabase
- **XSS prevention** through input sanitization

### Data Protection
- **Soft delete** implementation
- **Error message sanitization**
- **No sensitive data** in client-side code
- **Secure environment variable** handling

## 📁 Project Structure

```
alx-polly/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── admin/                # Admin panel
│   │   ├── create/               # Poll creation
│   │   ├── polls/                # Poll management
│   │   └── layout.tsx           # Dashboard layout
│   ├── lib/                      # Application logic
│   │   ├── actions/              # Server actions
│   │   ├── context/              # React contexts
│   │   └── types/                # TypeScript types
│   └── components/               # Reusable components
├── components/                   # UI components
│   └── ui/                      # shadcn/ui components
├── lib/                         # Utility libraries
│   ├── supabase/                # Supabase configuration
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues
- Verify your Supabase URL and API key in `.env.local`
- Check that your Supabase project is active
- Ensure the database schema is properly set up

#### Authentication Problems
- Clear browser cookies and local storage
- Check that RLS policies are correctly configured
- Verify user registration is working

#### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run type-check`
- Verify all environment variables are set

### Getting Help

If you encounter issues not covered here:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---

**Happy Polling! 🗳️**
