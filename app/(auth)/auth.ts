import NextAuth, { type User, type Session } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

import { getUserByEmail, createUser } from '@/lib/db/queries';
import { ensureMinimumCredits, setUserCredits } from '@/lib/repositories/credits';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Build providers conditionally based on env vars to avoid invalid_client
const configuredProviders = [] as any[];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  configuredProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
} else {
  console.warn(
    'Google auth not configured: set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET',
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  configuredProviders.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
} else {
  console.warn(
    'GitHub auth not configured: set AUTH_GITHUB_ID and AUTH_GITHUB_SECRET',
  );
}

// Always enable credentials provider for email/password sign-in
configuredProviders.push(
  Credentials({
    name: 'Email and Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (creds) => {
      try {
        const email = creds?.email?.toString().trim().toLowerCase();
        const password = creds?.password?.toString();
        if (!email || !password) return null;
        const users = await getUserByEmail(email);
        const u = users?.[0];
        if (!u || !u.passwordHash) return null;
        const { compare } = await import('bcrypt-ts');
        const ok = await compare(password, u.passwordHash);
        if (!ok) return null;
        return {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          image: u.image ?? null,
        } as any;
      } catch (e) {
        console.error('Credentials authorize failed', e);
        return null;
      }
    },
  }),
);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  // Require secret from environment (set AUTH_SECRET or NEXTAUTH_SECRET)
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Make host resolution explicit for Vercel/custom domains
  trustHost:
    (process.env.AUTH_TRUST_HOST || '').toLowerCase() === 'true' ||
    Boolean(process.env.VERCEL),
  // Optionally proxy OAuth callbacks through a stable domain
  // e.g. https://chat.opulentia.ai
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  providers: configuredProviders,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow Credentials provider without requiring OAuth-specific objects
      if (account?.provider === 'credentials') {
        try {
          if (user?.id) await setUserCredits({ userId: user.id as string, credits: 1000 });
        } catch {}
        return true;
      }
      if (!account || !profile || !user?.email) {
        console.log(
          'Auth provider details missing (account, profile, or user email).',
        );
        return false;
      }

      const { email, name, image } = user;

      try {
        const existingUserArray = await getUserByEmail(email);

        if (existingUserArray.length === 0) {
          await createUser({
            email,
            name: name ?? null,
            image: image ?? null,
          });
          console.log(`Created new user: ${email}`);
        } else {
          console.log(`User already exists: ${email}`);
        }
        try {
          const id = (existingUserArray[0]?.id as string | undefined) ?? (user?.id as string | undefined);
          if (id) await setUserCredits({ userId: id, credits: 1000 });
        } catch {}
        return true;
      } catch (error) {
        console.error('Error during signIn DB operations:', error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user?.email) {
        try {
          const dbUserArray = await getUserByEmail(user.email);
          if (dbUserArray.length > 0) {
            token.id = dbUserArray[0].id;
          } else {
            console.error(
              `User not found in DB during jwt callback: ${user.email}`,
            );
          }
        } catch (error) {
          console.error('Error fetching user during jwt callback:', error);
        }
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: { id?: string; [key: string]: any };
    }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      } else if (!token.id) {
        console.error('Token ID missing in session callback');
      }
      return session;
    },
  },
});
