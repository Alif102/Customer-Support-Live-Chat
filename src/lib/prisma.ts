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

const prismaClientSingleton = () => {
  console.log("Creating new PrismaClient instance")
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma