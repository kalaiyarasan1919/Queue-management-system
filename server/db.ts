import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// In development, allow running without Postgres. Only initialize when DATABASE_URL is present.
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : undefined as unknown as Pool;

export const db = process.env.DATABASE_URL
  ? drizzle({ client: pool as Pool, schema })
  : (undefined as unknown as ReturnType<typeof drizzle>);