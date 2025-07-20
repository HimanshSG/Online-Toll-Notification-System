import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Ensure the database is provisioned.");
}

export default defineConfig({
  schema: "./shared/schema.js",
  out: "./db/migrations",
  driver: "mongodb",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
});
