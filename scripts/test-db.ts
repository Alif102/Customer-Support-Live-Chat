// import prisma from '../lib/prisma'

import prisma from "@/lib/prisma";

async function testConnection() {
  try {
    await prisma.$connect()
    console.log("✅ Database connected successfully!")

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log("✅ Test query successful:", result)

    await prisma.$disconnect()
  } catch (error) {
    console.error("❌ Database connection failed:", error)
  }
}

testConnection()