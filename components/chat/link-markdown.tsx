import Link from 'next/link';
import { cn } from '@/lib/utils';

type LinkMarkdownProps = {
  href: string | URL;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'children' | 'className'>;

export function LinkMarkdown({
  href,
  children,
  className,
  ...props
}: LinkMarkdownProps) {
  const hrefStr = typeof href === 'string' ? href : href.toString();
  const isExternal = hrefStr.startsWith('http://') || hrefStr.startsWith('https://');

  if (isExternal) {
    return (
      <a
        href={hrefStr}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('text-primary hover:underline', className)}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={hrefStr}
      className={cn('text-primary hover:underline', className)}
      {...props}
    >
      {children}
    </Link>
  );
}
