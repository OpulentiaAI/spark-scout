import { ModelsHeader } from './models-header';
import { auth } from '../(auth)/auth';
import { SessionProvider } from 'next-auth/react';
import type { Metadata } from 'next';
import { modelsData, providers } from '@/lib/models/models.generated';

const totalModels = modelsData.length;
const totalProviders = providers.length;

const pageTitle = `Models | Opulent OS`;
const pageDescription = `Browse ${totalModels} models across ${totalProviders} providers from Vercel AI Gateway in Opulent OS. Filter and compare by provider, context window, and pricing.`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    'Opulent OS',
    'Vercel AI Gateway',
    'models',
    'LLM',
    'AI models',
    'providers',
  ],
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: '/models',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
  },
  alternates: {
    canonical: '/models',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const HEADER_HEIGHT = '2.75rem';

export default async function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <div
        className="h-dvh max-h-dvh grid grid-rows-[auto_1fr]"
        style={
          {
            '--header-height': HEADER_HEIGHT,
          } as React.CSSProperties
        }
      >
        <ModelsHeader />
        <div className="relative flex-1 min-h-0 ">{children}</div>
      </div>
    </SessionProvider>
  );
}
