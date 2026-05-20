import { PrismaClient } from '../generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let _prisma: PrismaClient;

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!_prisma) {
      console.log('[Prisma] Initializing client...');
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set in environment variables');
      }
      const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaPg(pool);
      _prisma = new PrismaClient({ adapter });
    }
    return Reflect.get(_prisma, prop, receiver);
  }
});


