import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up initial data...')

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
    { name: 'TOEIC® Pack - Progress', duration: 15 },
    { name: 'TOEIC® Pack - Perform', duration: 20 },
    { name: 'PRO Pack - Launch', duration: 20 },
    { name: 'PRO Pack - Scale', duration: 40 },
    { name: 'PRO Pack - Lead', duration: 60 },
    { name: 'Travel English', duration: 10 },
    { name: 'Speak English with Confidence', duration: 10 },
    { name: 'Serve and Sell in English', duration: 10 }
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

  console.log('\nSetup complete!')
  console.log('\nYou can now:')
  console.log('1. Log in as teacher with:', teacherEmail, '/', teacherPassword)
  console.log('2. Create resources in the Resource Bank')
  console.log('3. Add students and assign them resources')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

