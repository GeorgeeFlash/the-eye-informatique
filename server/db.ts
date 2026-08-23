import "dotenv/config"
import { PrismaClient } from "@/lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { serverEnv } from "@/server/env-server"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({ connectionString: serverEnv.DATABASE_URL })

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
