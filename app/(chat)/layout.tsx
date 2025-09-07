import { ChatProviders } from './chat-providers';
import { auth } from '../(auth)/auth';
import { cookies } from 'next/headers';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DefaultModelProvider } from '@/providers/default-model-provider';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { AppSidebar } from '@/components/app-sidebar';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { SessionProvider } from 'next-auth/react';
import type { ModelId } from '@/lib/models/model-id';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const cookieModel = cookieStore.get('chat-model')?.value as ModelId;
  const isAnonymous = !session?.user;

  // Choose a default model respecting anonymous limits when applicable
  let defaultModel: ModelId;
  if (isAnonymous) {
    const candidate = cookieModel ?? undefined;
    const allowed = ANONYMOUS_LIMITS.AVAILABLE_MODELS as readonly ModelId[];
    defaultModel = candidate && (allowed as readonly string[]).includes(candidate)
      ? candidate
      : (allowed[0] as ModelId);
  } else {
    defaultModel = (cookieModel ?? DEFAULT_CHAT_MODEL) as ModelId;
  }

  return (
    <SessionProvider session={session}>
      <ChatProviders user={session?.user}>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>
            <DefaultModelProvider defaultModel={defaultModel}>
              <KeyboardShortcuts />

              {children}
            </DefaultModelProvider>
          </SidebarInset>
        </SidebarProvider>
      </ChatProviders>
    </SessionProvider>
  );
}
