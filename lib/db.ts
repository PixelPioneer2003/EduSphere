import { PrismaClient } from '@/lib/generated/prisma'; // ✅ correct
// import { PrismaClient } from '@prisma/client'; // ✅ correct
declare global {
    var prisma: PrismaClient | undefined;
};

export const db = globalThis.prisma || new PrismaClient();

if(process.env.NODE_ENV !== 'production') globalThis.prisma = db;