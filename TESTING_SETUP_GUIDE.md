# Testing Framework Implementation Guide

Welcome! This document will help you set up a testing framework for the Brizzle TOEIC® Course Content Management System.

## 📋 Project Overview

This is a Next.js 14 application for managing TOEIC® test preparation courses. It includes:
- **Role-based access**: Separate interfaces for teachers and students
- **Resource management**: Create and manage worksheets, lessons, exercises, and quizzes
- **Student assignments**: Assign resources to students
- **Progress tracking**: Monitor student completion and progress
- **Authentication**: NextAuth.js with password reset functionality
- **Email**: Resend integration for password reset emails
- **Database**: Supabase (PostgreSQL) with Prisma ORM

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Email**: Resend
- **Deployment**: Netlify

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- npm >= 10.0.0
- Git
- A GitHub account (you should have received an invitation)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/GeorginaMudditt/toeic-course-content.git
   cd brizzle-toeic-course-content
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local` (if it exists) or create `.env.local`
   - Ask the project owner for the required environment variables:
     - `DATABASE_URL` - Supabase database connection string
     - `NEXTAUTH_SECRET` - Secret for NextAuth session encryption
     - `NEXTAUTH_URL` - Application URL (http://localhost:3000 for local)
     - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
     - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
     - `RESEND_API_KEY` - Resend API key for emails

4. **Set up the database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Verify setup**:
   - Visit http://localhost:3000
   - You should see the login page
   - Visit http://localhost:3000/test to see the test page

## 📁 Project Structure

```
brizzle-toeic-course-content/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── avatar/       # Avatar upload/update endpoints
│   │   ├── resources/    # Resource management endpoints
│   │   └── ...
│   ├── student/          # Student-facing pages
│   ├── teacher/          # Teacher-facing pages
│   └── ...
├── components/           # React components
│   ├── Navbar.tsx        # Main navigation
│   ├── AvatarSelector.tsx # Avatar selection component
│   └── ...
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── email.ts          # Email sending utilities
│   ├── supabase.ts       # Supabase client setup
│   └── ...
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema definition
├── scripts/              # Utility scripts
└── public/              # Static assets
```

## 🧪 Current Testing Status

**No automated testing framework is currently set up.** The project relies on manual testing.

### What Exists:
- ✅ ESLint configuration (`npm run lint`)
- ✅ Manual test page at `/test`
- ✅ Manual database connection test script

### What's Missing:
- ❌ Unit tests
- ❌ Component tests
- ❌ Integration tests
- ❌ E2E tests
- ❌ API route tests

## 🎯 Testing Framework Recommendations

### Option 1: Jest + React Testing Library (Recommended for Start)

**Best for**: Unit tests, component tests, API route tests

**Setup**:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest
```

**Why**: 
- Industry standard for React/Next.js projects
- Great documentation and community support
- Works well with TypeScript
- Can test components, utilities, and API routes

### Option 2: Vitest (Modern Alternative)

**Best for**: Faster unit tests, modern tooling

**Setup**:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Why**:
- Faster than Jest
- Better TypeScript support out of the box
- Modern ESM support
- Growing popularity

### Option 3: Playwright (For E2E Testing)

**Best for**: End-to-end testing of critical user flows

**Setup**:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Why**:
- Excellent for testing real user interactions
- Can test across browsers
- Great for testing authentication flows, form submissions, etc.

## 📝 Suggested Testing Priorities

### High Priority (Start Here)

1. **Authentication Flow**
   - Login functionality
   - Password reset flow
   - Session management

2. **API Routes**
   - `/api/auth/forgot-password` - Password reset request
   - `/api/auth/reset-password` - Password reset completion
   - `/api/avatar` - Avatar update
   - `/api/avatar/upload` - Avatar upload

3. **Critical Components**
   - `Navbar` - Navigation and user menu
   - `AvatarSelector` - Avatar selection modal
   - Login page

### Medium Priority

4. **Resource Management**
   - Resource creation
   - Resource assignment
   - File uploads

5. **Student Features**
   - Assignment viewing
   - Progress tracking
   - Worksheet completion

### Lower Priority (Nice to Have)

6. **Utility Functions**
   - Date formatting (`lib/date-utils.ts`)
   - Email utilities (`lib/email.ts`)

## 🏗️ Implementation Steps

### Step 1: Choose Your Testing Framework

Decide between Jest or Vitest based on your preference. Jest is more established, Vitest is more modern.

### Step 2: Set Up the Framework

1. Install dependencies
2. Create configuration files:
   - `jest.config.js` or `vitest.config.ts`
   - `setupTests.ts` (for test setup)
3. Add test scripts to `package.json`:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```

### Step 3: Create Test Structure

Create a `__tests__` or `tests` directory structure:
```
__tests__/
├── components/
│   ├── Navbar.test.tsx
│   └── AvatarSelector.test.tsx
├── api/
│   ├── auth/
│   │   └── forgot-password.test.ts
│   └── avatar.test.ts
├── lib/
│   └── email.test.ts
└── setupTests.ts
```

### Step 4: Write Your First Test

Start with something simple to verify the setup works:

```typescript
// __tests__/lib/email.test.ts
import { sendPasswordResetEmail } from '@/lib/email'

describe('Email utilities', () => {
  it('should validate email function exists', () => {
    expect(typeof sendPasswordResetEmail).toBe('function')
  })
})
```

### Step 5: Set Up Test Database

For integration tests, you'll need a test database:
- Use a separate Supabase project for testing, OR
- Use an in-memory database, OR
- Use database mocking

## 📚 Resources & Documentation

### Testing Libraries
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

### Next.js Testing
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [Testing API Routes](https://nextjs.org/docs/api-routes/introduction#api-routes)

### Project-Specific
- Check `README.md` for project setup details
- Check `SUPABASE_SETUP.md` for database configuration
- Check `EMAIL_SETUP.md` for email configuration

## 🔄 Git Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/add-testing-framework
   ```

2. **Make your changes**:
   - Add testing dependencies
   - Create configuration files
   - Write tests
   - Update documentation

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add Jest testing framework and initial tests"
   ```

4. **Push and create Pull Request**:
   ```bash
   git push origin feature/add-testing-framework
   ```
   Then create a PR on GitHub for review.

## 💡 Best Practices

1. **Start Small**: Begin with a few critical tests, then expand
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Keep Tests Independent**: Each test should be able to run in isolation
4. **Use Descriptive Names**: Test names should clearly describe what they're testing
5. **Mock External Dependencies**: Don't make real API calls or database queries in unit tests
6. **Maintain Test Coverage**: Aim for good coverage of critical paths (80%+ is great)
7. **Run Tests Before Committing**: Use `npm test` or `npm run test:watch`

## 🐛 Common Issues & Solutions

### Issue: Tests can't find modules
**Solution**: Check your test configuration's `moduleNameMapper` or `resolve` settings

### Issue: Environment variables not available in tests
**Solution**: Set up test environment variables in your test setup file

### Issue: Next.js modules not resolving
**Solution**: Configure Jest/Vitest to handle Next.js's module resolution

### Issue: Database connection in tests
**Solution**: Use a test database or mock the database layer

## 📞 Getting Help

- Check existing documentation in the project
- Review similar Next.js testing setups online
- Ask questions via GitHub Issues or Pull Request comments
- Check the project's commit history to understand recent changes

## ✅ Checklist for Implementation

- [ ] Choose testing framework (Jest or Vitest)
- [ ] Install dependencies
- [ ] Create configuration files
- [ ] Set up test scripts in package.json
- [ ] Create test directory structure
- [ ] Write first test to verify setup
- [ ] Set up test database/mocking strategy
- [ ] Write tests for authentication flow
- [ ] Write tests for API routes
- [ ] Write tests for critical components
- [ ] Set up CI/CD to run tests automatically
- [ ] Document testing approach in README
- [ ] Create Pull Request for review

## 🎉 Good Luck!

Take your time, start small, and don't hesitate to ask questions. The goal is to create a solid testing foundation that will help maintain code quality as the project grows.

Happy testing! 🧪
