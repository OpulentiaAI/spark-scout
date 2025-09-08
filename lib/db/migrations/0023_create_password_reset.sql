CREATE TABLE IF NOT EXISTS "PasswordReset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" varchar(128) NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
-- Optional: index for quick lookup
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON "PasswordReset" ("userId");
CREATE INDEX IF NOT EXISTS password_reset_expires_idx ON "PasswordReset" ("expiresAt");
