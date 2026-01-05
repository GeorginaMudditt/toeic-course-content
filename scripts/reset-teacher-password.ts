import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const teacherEmail = 'hello@brizzle-english.com'
  const newPassword = 'X-press129'
  
  console.log('Resetting teacher password...')
  
  const teacher = await prisma.user.findUnique({
    where: { email: teacherEmail }
  })

  if (!teacher) {
    console.log('❌ Teacher account not found. Creating new account...')
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.create({
      data: {
        email: teacherEmail,
        name: 'Teacher',
        password: hashedPassword,
        role: 'TEACHER'
      }
    })
    console.log('✓ Created teacher account')
  } else {
    console.log('✓ Found teacher account, updating password...')
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { email: teacherEmail },
      data: { password: hashedPassword }
    })
    console.log('✓ Password updated')
  }

  console.log('\nTeacher login credentials:')
  console.log('Email:', teacherEmail)
  console.log('Password:', newPassword)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


