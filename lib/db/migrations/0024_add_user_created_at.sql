-- Add createdAt to User if missing to satisfy Drizzle schema
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now() NOT NULL;
