-- Ensure emails are unique
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS user_email_unique UNIQUE ("email");
