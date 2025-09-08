import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { SocialAuthProviders } from '@/components/social-auth-providers';
import { EmailPasswordLogin } from '@/components/auth/email-password-login';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="container grid h-dvh w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4 md:left-8 md:top-8',
        )}
      >
        <>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </>
      </Link>

      {/* Left panel logo (desktop) */}
      <div className="relative hidden h-full lg:block">
        <Image
          src="/images/opulent-logo_dark.png"
          alt="Opulent logo"
          fill
          priority
          className="object-contain p-12 bg-muted"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      {/* Right panel content */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center items-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>
          <div className="w-full space-y-4">
            <EmailPasswordLogin />
            <div className="text-center text-sm text-muted-foreground">or</div>
            <SocialAuthProviders />
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link
              href="/register"
              className="hover:text-brand underline underline-offset-4"
            >
              Don&apos;t have an account? Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
