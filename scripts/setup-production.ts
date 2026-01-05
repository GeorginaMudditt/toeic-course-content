import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// This script uses the DATABASE_URL from environment variables
// Make sure to set it before running: export DATABASE_URL="your-production-url"
const prisma = new PrismaClient()

async function main() {
  console.log('Setting up production data...')
  console.log('Using DATABASE_URL from environment variables')

  // Create teacher account
  const teacherEmail = 'hello@brizzle-english.com'
  const teacherPassword = 'X-press129'
  
  const existingTeacher = await prisma.user.findUnique({
    where: { email: teacherEmail }
  })

  if (!existingTeacher) {
    const hashedPassword = await bcrypt.hash(teacherPassword, 10)
    const teacher = await prisma.user.create({
      data: {
        email: teacherEmail,
        name: 'Teacher',
        password: hashedPassword,
        role: 'TEACHER'
      }
    })
    console.log('✓ Created teacher account:', teacherEmail, 'Password:', teacherPassword)
  } else {
    console.log('✓ Teacher account already exists')
  }

  // Create courses
  const courses = [
    { name: 'TOEIC Preparation - 15 Hours', duration: 15 },
    { name: 'TOEIC Preparation - 30 Hours', duration: 30 },
    { name: 'TOEIC Preparation - 45 Hours', duration: 45 },
    { name: 'TOEIC Preparation - 60 Hours', duration: 60 }
  ]

  const teacher = await prisma.user.findUnique({
    where: { email: teacherEmail }
  })

  if (teacher) {
    for (const courseData of courses) {
      const existingCourse = await prisma.course.findFirst({
        where: {
          name: courseData.name,
          creatorId: teacher.id
        }
      })

      if (!existingCourse) {
        await prisma.course.create({
          data: {
            ...courseData,
            creatorId: teacher.id
          }
        })
        console.log(`✓ Created course: ${courseData.name}`)
      } else {
        console.log(`✓ Course already exists: ${courseData.name}`)
      }
    }
  }

  // Create demo student account
  const studentEmail = 'student@example.com'
  const studentPassword = 'student123'
  
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail }
  })

  if (!existingStudent) {
    const hashedPassword = await bcrypt.hash(studentPassword, 10)
    await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Demo Student',
        password: hashedPassword,
        role: 'STUDENT'
      }
    })
    console.log('✓ Created demo student account:', studentEmail, 'Password:', studentPassword)
  } else {
    console.log('✓ Demo student account already exists')
  }

  console.log('\nSetup complete!')
  console.log('\nLogin credentials:')
  console.log('Teacher:', teacherEmail, '/', teacherPassword)
  console.log('Student:', studentEmail, '/', studentPassword)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


