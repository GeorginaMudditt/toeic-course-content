import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating demo student account...')

  const studentEmail = 'student@example.com'
  const studentPassword = 'student123'
  
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail }
  })

  if (!existingStudent) {
    const hashedPassword = await bcrypt.hash(studentPassword, 10)
    const student = await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Demo Student',
        password: hashedPassword,
        role: 'STUDENT'
      }
    })
    console.log('✓ Created demo student account:', studentEmail, 'Password:', studentPassword)
    console.log('\nYou can now:')
    console.log('1. Log in as student at http://localhost:3000/login')
    console.log('2. Email: student@example.com')
    console.log('3. Password: student123')
    console.log('\nNote: The student won\'t see any assignments until you:')
    console.log('- Enroll them in a course (Teacher → Students → Manage)')
    console.log('- Assign resources to them')
  } else {
    console.log('✓ Demo student account already exists')
    console.log('Email:', studentEmail)
    console.log('Password:', studentPassword)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


