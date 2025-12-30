# TOEIC® Course Content Management System

A tailored course management system for TOEIC® test preparation courses with customizable resource assignments.

## Features

- **Role-based Access Control**: Separate interfaces for teachers and students
- **Resource Bank**: Create and manage a library of worksheets, lessons, exercises, and quizzes
- **Custom Course Assignment**: Assign specific resources to each student based on their needs
- **Online Worksheets**: Students can complete worksheets online
- **PDF Export**: Download worksheets as PDFs
- **Protected Links**: Non-shareable, unique links per student
- **Progress Tracking**: Monitor student progress and completion

## Course Durations

- 15 hours
- 30 hours
- 45 hours
- 60 hours

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **Supabase (PostgreSQL)** - Database
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **jsPDF** - PDF generation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - You're using the existing project: **Brizzle** (Project ID: ulrwcortyhassmytkcij)
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions
   - Get your connection string from [Project Settings > Database](https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/settings/database) (use Connection Pooling)

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add:
# - Your Supabase DATABASE_URL (use Connection Pooling connection string)
# - Your NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
# Or for production: npm run db:migrate:deploy
```

5. Run the setup script to create initial teacher account and courses:
```bash
npm run setup
```
This will create:
- Teacher account: `hello@brizzle-english.com` / `X-press129`
- Four courses: 15, 30, 45, and 60 hours

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

8. Log in as the teacher and start creating resources!

## Supabase Setup Notes

- **Connection Pooling**: Use the "Connection Pooling" connection string from Supabase (port 6543) for better performance with serverless functions
- **Direct Connection**: For migrations, you may need to use the direct connection string (port 5432)
- **Migrations**: For production, use `npm run db:migrate:deploy` instead of `db:push`

## Database Schema

- **Users**: Teachers and students with role-based access
- **Resources**: Worksheets, lessons, exercises, and quizzes
- **Courses**: Course templates (15, 30, 45, 60 hours)
- **Enrollments**: Student-course relationships
- **Assignments**: Resources assigned to specific students
- **Progress**: Student progress tracking for each assignment

## Next Steps

1. Create your teacher account
2. Add resources to your resource bank
3. Create courses and enroll students
4. Assign resources to students
5. Monitor progress

