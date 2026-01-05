const { PrismaClient } = require('@prisma/client');

// Try transaction mode for connection pooling
const url = 'postgresql://postgres:924qzD3bv1Xihm8m@db.ulrwcortyhassmytkcij.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1';
const prisma = new PrismaClient({
  datasources: { db: { url } },
  log: ['error']
});

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connection successful');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Query successful, found', users.length, 'users');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

test();
