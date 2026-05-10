import { PrismaClient } from "@prisma/client"
import "dotenv/config"

const prisma = new PrismaClient()

async function main() {
  // const agentEmail = process.env.SEED_AGENT_EMAIL
  const agentEmail = "rizwan@gmail.com"

  if (!agentEmail) {
    console.warn("SEED_AGENT_EMAIL not set, skipping agent seeding.")
    return
  }

  await prisma.user.upsert({
    where: { email: agentEmail },
    update: { role: "AGENT" },
    create: {
      email: agentEmail,
      role: "AGENT",
      name: "Support Agent",
    },
  })

  console.log(`Agent seeded: ${agentEmail}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
