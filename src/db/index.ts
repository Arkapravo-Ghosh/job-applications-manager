import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// For query connections in serverless / SSR
const client = postgres(connectionString, {
  prepare: false, // Recommended for connection poolers like Neon
  ssl: "require",
});

export const db = drizzle(client, { schema });
