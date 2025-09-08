import Link from 'next/link';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import Image from 'next/image';
import ResetForm from '@/components/auth/reset-form';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPage() {
  return (
    <div className="container grid h-dvh w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: 'ghost' }), 'absolute left-4 top-4 md:left-8 md:top-8')}
      >
        Back to Login
      </Link>
      <div className="relative hidden h-full lg:block">
        <picture>
          <source srcSet="/images/opulent-logo_dark.webp" type="image/webp" />
          <Image
            src="/images/opulent-logo_dark_512.png"
            alt="Opulent logo"
            fill
            priority
            className="object-contain p-12 bg-muted"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </picture>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center items-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="text-sm text-muted-foreground">Choose a new password</p>
          </div>
          <ResetForm />
        </div>
      </div>
    </div>
  );
}

