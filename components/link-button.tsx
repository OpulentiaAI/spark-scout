import * as React from 'react';
import Link from 'next/link';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type LinkButtonProps = {
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  href: string | URL;
  disabled?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'>;

function LinkButton({
  className,
  variant,
  size,
  href,
  disabled,
  children,
  ...props
}: LinkButtonProps) {
  const hrefStr = typeof href === 'string' ? href : href.toString();
  return (
    <Link
      href={hrefStr}
      className={cn(
        buttonVariants({ variant, size, className }),
        disabled && 'pointer-events-none opacity-50',
      )}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}

export { LinkButton };
