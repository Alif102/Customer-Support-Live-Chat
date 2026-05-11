// import { PrismaClient } from '@prisma/client'
//
// const prismaClientSingleton = () => {return new PrismaClient()}
//
// declare const globalThis: {
//   prismaGlobal: ReturnType<typeof prismaClientSingleton>;
// } & typeof global;
//
// const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
//
// export default prisma
//
// if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma


import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prismaClientSingleton = () => {
  logger.info("Creating new PrismaClient instance")
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma