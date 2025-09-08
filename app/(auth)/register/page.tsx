import Link from 'next/link';
import type { Metadata } from 'next';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { SocialAuthProviders } from '@/components/social-auth-providers';
import { EmailPasswordRegister } from '@/components/auth/email-password-register';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create an account to get started.',
};

export default function RegisterPage() {
  return (
    <div className="container grid h-dvh w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 md:right-8 md:top-8',
        )}
      >
        Login
      </Link>
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            {/* Assuming Icons.logo exists */}
            {/* <Icons.logo className="mx-auto h-6 w-6" /> */}
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">Create an account</p>
          </div>
          <div className="w-full space-y-4">
            <EmailPasswordRegister />
            <div className="text-center text-sm text-muted-foreground">or</div>
            <SocialAuthProviders />
          </div>
          {/* <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link
              href="/terms"
              className="hover:text-brand underline underline-offset-4"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="hover:text-brand underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p> */}
        </div>
      </div>
    </div>
  );
}
