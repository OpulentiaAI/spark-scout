'use client';

import type { User } from 'next-auth';
import { ChatIdProvider } from '@/providers/chat-id-provider';

import { ChatPrefetch } from '@/components/chat-prefetch';
import { AnonymousSessionInit } from '@/components/anonymous-session-init';

interface ChatProvidersProps {
  children: React.ReactNode;
  user: User | undefined;
}

export function ChatProviders({ children, user }: ChatProvidersProps) {
  return (
    <ChatIdProvider>
      <AnonymousSessionInit />
      <ChatPrefetch user={user} />
      {children}
    </ChatIdProvider>
  );
}
