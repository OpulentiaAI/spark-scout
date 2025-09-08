'use client';

import { useRef, createContext, useContext } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import type { UseChatHelpers } from '@ai-sdk/react';
import {
  AbstractChat,
  type ChatInit,
  type ChatState,
  type ChatStatus,
  type UIMessage,
} from 'ai';
import type { ChatMessage } from '@/lib/ai/types';
import { throttle } from '@/components/throttle';
import {
  type MarkdownCacheEntry,
  getMarkdownFromCache,
  precomputeMarkdownForAllMessages,
} from '@/lib/stores/markdown-cache';
import equal from 'fast-deep-equal';

// --- Freeze detector (RAF jitter) and action correlation ---
let __freezeDetectorStarted = false;
let __freezeRafId = 0;
let __freezeLastTs = 0;
let __lastActionLabel: string | undefined;
let __clearLastActionTimer: ReturnType<typeof setTimeout> | null = null;

function markLastAction(label: string) {
  __lastActionLabel = label;
  if (typeof window !== 'undefined') {
    if (__clearLastActionTimer) clearTimeout(__clearLastActionTimer);
    __clearLastActionTimer = setTimeout(() => {
      if (__lastActionLabel === label) __lastActionLabel = undefined;
    }, 250);
  }
}

function startFreezeDetector({
  thresholdMs = 80,
}: {
  thresholdMs?: number;
} = {}): void {
  if (typeof window === 'undefined' || __freezeDetectorStarted) return;
  __freezeDetectorStarted = true;
  __freezeLastTs = performance.now();
  const tick = (now: number) => {
    const expected = __freezeLastTs + 16.7;
    const blockedMs = now - expected;
    if (blockedMs > thresholdMs) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Freeze]',
        `${Math.round(blockedMs)}ms`,
        'lastAction=',
        __lastActionLabel,
      );
    }
    __freezeLastTs = now;
    __freezeRafId = window.requestAnimationFrame(tick);
  };
  __freezeRafId = window.requestAnimationFrame(tick);
  window.addEventListener('beforeunload', () => {
    if (__freezeRafId) cancelAnimationFrame(__freezeRafId);
  });
}

if (typeof window !== 'undefined') {
  startFreezeDetector({ thresholdMs: 80 });
}

// Helper types to safely derive the message part and part.type types from UI_MESSAGE
type UIMessageParts<UI_MSG> = UI_MSG extends { parts: infer P } ? P : never;
type UIMessagePart<UI_MSG> = UIMessageParts<UI_MSG> extends Array<infer I>
  ? I
  : never;
type UIMessagePartType<UI_MSG> = UIMessagePart<UI_MSG> extends { type: infer T }
  ? T
  : never;

function extractPartTypes<UI_MESSAGE extends UIMessage>(
  message: UI_MESSAGE,
): {
  partsRef: UIMessageParts<UI_MESSAGE>;
  types: Array<UIMessagePartType<UI_MESSAGE>>;
} {
  const partsRef = (message as unknown as { parts: unknown[] })
    .parts as UIMessageParts<UI_MESSAGE>;
  const types = (partsRef as Array<UIMessagePart<UI_MESSAGE>>).map(
    (part) =>
      (
        part as UIMessagePart<UI_MESSAGE> & {
          type: UIMessagePartType<UI_MESSAGE>;
        }
      ).type,
  ) as Array<UIMessagePartType<UI_MESSAGE>>;
  return { partsRef, types };
}

export interface ChatStoreState<UI_MESSAGE extends UIMessage> {
  id: string | undefined;
  messages: UI_MESSAGE[];
  status: ChatStatus;
  error: Error | undefined;

  // Throttled messages cache
  _throttledMessages: UI_MESSAGE[] | null;
  // Cached selectors to prevent infinite loops
  _markdownCache: Map<string, MarkdownCacheEntry>;

  // Actions
  setId: (id: string | undefined) => void;
  setMessages: (messages: UI_MESSAGE[]) => void;
  setStatus: (status: ChatStatus) => void;
  setError: (error: Error | undefined) => void;
  setNewChat: (id: string, messages: UI_MESSAGE[]) => void;
  pushMessage: (message: UI_MESSAGE) => void;
  popMessage: () => void;
  replaceMessage: (index: number, message: UI_MESSAGE) => void;

  // Getters
  getLastMessageId: () => string | null;
  getMessageIds: () => string[];
  getThrottledMessages: () => UI_MESSAGE[];
  getInternalMessages: () => UI_MESSAGE[];
  getMessagePartTypesById: (
    messageId: string,
  ) => Array<UIMessagePartType<UI_MESSAGE>>;
  getMessagePartsRangeCached: (
    messageId: string,
    startIdx: number,
    endIdx: number,
    type?: string,
  ) => UIMessageParts<UI_MESSAGE>;
  getMarkdownBlocksForPart: (messageId: string, partIdx: number) => string[];
  getMarkdownBlockCountForPart: (messageId: string, partIdx: number) => number;
  getMarkdownBlockByIndex: (
    messageId: string,
    partIdx: number,
    blockIdx: number,
  ) => string | null;
  getMessagePartByIdxCached: (
    messageId: string,
    partIdx: number,
  ) => UIMessageParts<UI_MESSAGE>[number];

  // Helpers (moved from globals into the store)
  currentChatHelpers: Pick<
    UseChatHelpers<UI_MESSAGE>,
    'stop' | 'sendMessage' | 'regenerate'
  > | null;
  setCurrentChatHelpers: (
    helpers: Pick<
      UseChatHelpers<UI_MESSAGE>,
      'stop' | 'sendMessage' | 'regenerate'
    >,
  ) => void;
}

const MESSAGES_THROTTLE_MS = 100;

export function createChatStore<UI_MESSAGE extends UIMessage>(
  initialMessages: UI_MESSAGE[] = [],
) {
  let throttledMessagesUpdater: (() => void) | null = null;

  return createStore<ChatStoreState<UI_MESSAGE>>()(
    devtools(
      subscribeWithSelector((set, get) => {
        if (!throttledMessagesUpdater) {
          throttledMessagesUpdater = throttle(() => {
            const state = get();
            const { cache } = precomputeMarkdownForAllMessages(
              state.messages,
              get()._markdownCache,
            );
            set({ _markdownCache: cache });
            set({ _throttledMessages: [...state.messages] });
          }, MESSAGES_THROTTLE_MS);
        }

        const initialPrecompute =
          precomputeMarkdownForAllMessages(initialMessages);
        return {
          id: undefined,
          messages: initialMessages,
          status: 'ready',
          error: undefined,
          currentChatHelpers: null,
          _throttledMessages: [...initialMessages],
          _markdownCache: initialPrecompute.cache,

          setId: (id) => {
            markLastAction('chat:setId');
            set({ id });
          },
          setMessages: (messages) => {
            markLastAction('chat:setMessages');
            const { cache } = precomputeMarkdownForAllMessages(
              messages,
              get()._markdownCache,
            );
            set({ messages: [...messages], _markdownCache: cache });
            throttledMessagesUpdater?.();
          },
          setStatus: (status) => {
            markLastAction('chat:setStatus');
            set({ status });
          },
          setError: (error) => {
            markLastAction('chat:setError');
            set({ error });
          },
          setNewChat: (id, messages) => {
            markLastAction('chat:setNewChat');
            const { cache } = precomputeMarkdownForAllMessages(messages);
            set({
              messages: [...messages],
              status: 'ready',
              error: undefined,
              id,
              _markdownCache: cache,
            });
            throttledMessagesUpdater?.();
          },
          pushMessage: (message) => {
            markLastAction('chat:pushMessage');
            set((state) => ({ messages: [...state.messages, message] }));
            throttledMessagesUpdater?.();
          },
          popMessage: () => {
            markLastAction('chat:popMessage');
            set((state) => ({ messages: state.messages.slice(0, -1) }));
            throttledMessagesUpdater?.();
          },
          replaceMessage: (index, message) => {
            markLastAction('chat:replaceMessage');
            set((state) => ({
              messages: [
                ...state.messages.slice(0, index),
                structuredClone(message),
                ...state.messages.slice(index + 1),
              ],
            }));
            throttledMessagesUpdater?.();
          },
          setCurrentChatHelpers: (helpers) => {
            markLastAction('chat:setCurrentChatHelpers');
            set({ currentChatHelpers: helpers });
          },

          getLastMessageId: () => {
            const state = get();
            return state.messages.length > 0
              ? state.messages[state.messages.length - 1].id
              : null;
          },
          getMessageIds: () => {
            const state = get();
            return (state._throttledMessages || state.messages).map(
              (m) => m.id,
            );
          },
          getThrottledMessages: () => {
            const state = get();
            return state._throttledMessages || state.messages;
          },
          getInternalMessages: () => {
            const state = get();
            return state.messages;
          },
          getMessagePartTypesById: (messageId) => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);
            const { types } = extractPartTypes<UI_MESSAGE>(message);
            return types as Array<UIMessagePartType<UI_MESSAGE>>;
          },
          getMessagePartsRangeCached: (messageId, startIdx, endIdx, type?) => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);

            const start = Math.max(0, Math.floor(startIdx));
            const end = Math.min(message.parts.length - 1, Math.floor(endIdx));

            if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
              const empty = [] as unknown as UIMessageParts<UI_MESSAGE>;
              return empty as unknown as ReturnType<
                ChatStoreState<UI_MESSAGE>['getMessagePartsRangeCached']
              >;
            }

            const baseSlice = message.parts.slice(start, end + 1);
            const result = (
              type === undefined
                ? baseSlice
                : (baseSlice.filter(
                    (p) => p.type === type,
                  ) as unknown as UIMessageParts<UI_MESSAGE>)
            ) as UIMessageParts<UI_MESSAGE>;
            return result as UIMessageParts<UI_MESSAGE>;
          },
          getMarkdownBlocksForPart: (messageId, partIdx) => {
            const state = get();
            const list = state._throttledMessages;
            if (!list) {
              throw new Error('No messages available');
            }
            const message = list.find((msg) => msg.id === messageId);
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);
            const selected = message.parts[partIdx] as unknown as
              | { type: string; text?: string }
              | undefined;
            if (!selected)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            if (selected.type !== 'text')
              throw new Error(
                `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected text, got ${String(
                  selected.type,
                )}`,
              );
            const text = selected.text || '';
            const cached = getMarkdownFromCache({
              cache: get()._markdownCache,
              messageId,
              partIdx,
              text,
            });
            if (cached) return cached.blocks;
            return [];
          },
          getMarkdownBlockCountForPart: (messageId, partIdx) => {
            const state = get();
            const list = state._throttledMessages || state.messages;
            const message = list.find((msg) => msg.id === messageId);
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);
            const selected = message.parts[partIdx] as unknown as
              | { type: string; text?: string }
              | undefined;
            if (!selected)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            if (selected.type !== 'text')
              throw new Error(
                `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected text, got ${String(
                  selected.type,
                )}`,
              );
            const text = selected.text || '';
            const cached = getMarkdownFromCache({
              cache: get()._markdownCache,
              messageId,
              partIdx,
              text,
            });
            const PREALLOCATED_BLOCKS = 100;
            if (cached)
              return Math.max(
                PREALLOCATED_BLOCKS,
                Math.ceil(cached.blocks.length / PREALLOCATED_BLOCKS) *
                  PREALLOCATED_BLOCKS,
              );
            return PREALLOCATED_BLOCKS;
          },
          getMarkdownBlockByIndex: (messageId, partIdx, blockIdx) => {
            const state = get();
            const list = state._throttledMessages;
            if (!list) {
              throw new Error('No messages available');
            }
            const message = list.find((msg) => msg.id === messageId);
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);
            const selected = message.parts[partIdx] as unknown as
              | { type: string; text?: string }
              | undefined;
            if (!selected)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            if (selected.type !== 'text')
              throw new Error(
                `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected text, got ${String(
                  selected.type,
                )}`,
              );
            const text = selected.text || '';
            const cached = getMarkdownFromCache({
              cache: get()._markdownCache,
              messageId,
              partIdx,
              text,
            });
            const blocks = cached ? cached.blocks : [];
            if (blockIdx < 0 || blockIdx >= blocks.length) return null;
            return blocks[blockIdx] ?? null;
          },
          getMessagePartByIdxCached: (messageId, partIdx) => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);
            const selected = message.parts[partIdx];
            if (selected === undefined)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            return selected as UIMessageParts<UI_MESSAGE>[number];
          },
        };
      }),
      { name: 'chat-store' },
    ),
  );
}

// Chat state implementation that bridges Zustand to ChatState interface
export class ZustandChatState<UI_MESSAGE extends UIMessage>
  implements ChatState<UI_MESSAGE>
{
  private store: ReturnType<typeof createChatStore<UI_MESSAGE>>;
  private messagesCallbacks = new Set<() => void>();
  private statusCallbacks = new Set<() => void>();
  private errorCallbacks = new Set<() => void>();

  constructor(store: ReturnType<typeof createChatStore<UI_MESSAGE>>) {
    this.store = store;
    this.store.subscribe(
      (state) => state._throttledMessages,
      () => this.messagesCallbacks.forEach((callback) => callback()),
    );
    this.store.subscribe(
      (state) => state.status,
      () => this.statusCallbacks.forEach((callback) => callback()),
    );
    this.store.subscribe(
      (state) => state.error,
      () => this.errorCallbacks.forEach((callback) => callback()),
    );
  }

  get messages(): UI_MESSAGE[] {
    return this.store.getState().messages;
  }
  set messages(newMessages: UI_MESSAGE[]) {
    this.store.getState().setMessages(newMessages);
  }
  get status(): ChatStatus {
    return this.store.getState().status;
  }
  set status(newStatus: ChatStatus) {
    this.store.getState().setStatus(newStatus);
  }
  get error(): Error | undefined {
    return this.store.getState().error;
  }
  set error(newError: Error | undefined) {
    this.store.getState().setError(newError);
  }
  pushMessage = (message: UI_MESSAGE) => {
    this.store.getState().pushMessage(message);
  };
  popMessage = () => {
    this.store.getState().popMessage();
  };
  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this.store.getState().replaceMessage(index, message);
  };
  snapshot = <T,>(value: T): T => structuredClone(value);

  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) => {
    const callback = throttleWaitMs
      ? throttle(onChange, throttleWaitMs)
      : onChange;
    this.messagesCallbacks.add(callback);
    return () => {
      this.messagesCallbacks.delete(callback);
    };
  };
  '~registerStatusCallback' = (onChange: () => void): (() => void) => {
    this.statusCallbacks.add(onChange);
    return () => {
      this.statusCallbacks.delete(onChange);
    };
  };
  '~registerErrorCallback' = (onChange: () => void): (() => void) => {
    this.errorCallbacks.add(onChange);
    return () => {
      this.errorCallbacks.delete(onChange);
    };
  };
  get storeInstance() {
    return this.store;
  }
}

export class ZustandChat<
  UI_MESSAGE extends UIMessage,
> extends AbstractChat<UI_MESSAGE> {
  private zustandState: ZustandChatState<UI_MESSAGE>;
  public store: ReturnType<typeof createChatStore<UI_MESSAGE>>;

  constructor({
    messages,
    state,
    id,
    ...init
  }: ChatInit<UI_MESSAGE> & {
    state: ZustandChatState<UI_MESSAGE>;
    id?: string;
  }) {
    super({ ...init, id, state });
    this.zustandState = state;
    this.store = state.storeInstance;
    console.log(
      'building zustand chat with id',
      id,
      'store id',
      this.store.getState().id,
    );
  }

  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) =>
    this.zustandState['~registerMessagesCallback'](onChange, throttleWaitMs);
  '~registerStatusCallback' = (onChange: () => void): (() => void) =>
    this.zustandState['~registerStatusCallback'](onChange);
  '~registerErrorCallback' = (onChange: () => void): (() => void) =>
    this.zustandState['~registerErrorCallback'](onChange);
}

type ChatStoreApi = ReturnType<typeof createChatStore<ChatMessage>>;

const ChatStoreContext = createContext<ChatStoreApi | undefined>(undefined);

export function ChatStoreProvider({
  children,
  initialMessages,
}: {
  children: React.ReactNode;
  initialMessages: Array<ChatMessage>;
}) {
  const storeRef = useRef<ChatStoreApi | null>(null);
  const chatStateRef = useRef<ZustandChatState<ChatMessage> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createChatStore<ChatMessage>(initialMessages);
  }
  if (chatStateRef.current === null) {
    chatStateRef.current = new ZustandChatState<ChatMessage>(storeRef.current);
  }
  return (
    <ChatStoreContext.Provider value={storeRef.current}>
      <ChatStateContext.Provider value={chatStateRef.current ?? undefined}>
        {children}
      </ChatStateContext.Provider>
    </ChatStoreContext.Provider>
  );
}

export function useChatStore<T>(
  selector: (store: ChatStoreState<ChatMessage>) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T;
export function useChatStore(): ChatStoreState<ChatMessage>;
export function useChatStore<T = ChatStoreState<ChatMessage>>(
  selector?: (store: ChatStoreState<ChatMessage>) => T,
  equalityFn?: (a: T, b: T) => boolean,
) {
  const store = useContext(ChatStoreContext);
  if (!store)
    throw new Error('useChatStore must be used within ChatStoreProvider');
  const selectorOrIdentity =
    (selector as (store: ChatStoreState<ChatMessage>) => T) ??
    ((s: ChatStoreState<ChatMessage>) => s as unknown as T);
  return useStoreWithEqualityFn(store, selectorOrIdentity, equalityFn);
}

export function useChatStoreApi() {
  const store = useContext(ChatStoreContext);
  if (!store)
    throw new Error('useChatStoreApi must be used within ChatStoreProvider');
  return store;
}

// Selector hooks using throttled messages where relevant
export const useChatMessages = () =>
  useChatStore((state) => state.getThrottledMessages());
export const useChatStatus = () => useChatStore((state) => state.status);
export const useChatError = () => useChatStore((state) => state.error);
export const useChatId = () => useChatStore((state) => state.id);
export const useMessageIds = () =>
  useChatStore((state) => state.getMessageIds(), shallow);
export const useMessageById = (messageId: string): ChatMessage =>
  useChatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((m) => m.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message;
  });

export const useMessageRoleById = (messageId: string): ChatMessage['role'] =>
  useChatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((m) => m.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message.role;
  });
export const useMessagePartsById = (messageId: string): ChatMessage['parts'] =>
  useChatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((m) => m.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message.parts;
  }, shallow);
export const useMessageResearchUpdatePartsById = (
  messageId: string,
): Extract<ChatMessage['parts'][number], { type: 'data-researchUpdate' }>[] =>
  useChatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((m) => m.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message.parts.filter(
      (p) => p.type === 'data-researchUpdate',
    ) as Extract<
      ChatMessage['parts'][number],
      { type: 'data-researchUpdate' }
    >[];
  }, equal);
export const useMessageMetadataById = (
  messageId: string,
): ChatMessage['metadata'] =>
  useChatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((m) => m.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message.metadata;
  }, shallow);
export const useMessagePartTypesById = (
  messageId: string,
): Array<ChatMessage['parts'][number]['type']> =>
  useChatStore((state) => state.getMessagePartTypesById(messageId), shallow);

export function useMessagePartByPartIdx(
  messageId: string,
  partIdx: number,
): ChatMessage['parts'][number];
export function useMessagePartByPartIdx<
  T extends ChatMessage['parts'][number]['type'],
>(
  messageId: string,
  partIdx: number,
  type: T,
): Extract<ChatMessage['parts'][number], { type: T }>;
export function useMessagePartByPartIdx<
  T extends ChatMessage['parts'][number]['type'],
>(messageId: string, partIdx: number, type?: T) {
  const part = useChatStore((state) =>
    state.getMessagePartByIdxCached(messageId, partIdx),
  );
  if (type !== undefined) {
    if (part.type !== type) {
      throw new Error(
        `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected ${String(type)}, got ${String(
          part.type,
        )}`,
      );
    }
  }
  return part as unknown as T extends ChatMessage['parts'][number]['type']
    ? Extract<ChatMessage['parts'][number], { type: T }>
    : ChatMessage['parts'][number];
}

export function useMessagePartsByPartRange(
  messageId: string,
  startIdx: number,
  endIdx: number,
): ChatMessage['parts'];
export function useMessagePartsByPartRange<
  T extends ChatMessage['parts'][number]['type'],
>(
  messageId: string,
  startIdx: number,
  endIdx: number,
  type: T,
): Array<Extract<ChatMessage['parts'][number], { type: T }>>;
export function useMessagePartsByPartRange<
  T extends ChatMessage['parts'][number]['type'],
>(messageId: string, startIdx: number, endIdx: number, type?: T) {
  return useChatStore(
    (state) =>
      state.getMessagePartsRangeCached(
        messageId,
        startIdx,
        endIdx,
        type as unknown as string | undefined,
      ) as unknown as ChatMessage['parts'],
    equal,
  ) as unknown as T extends ChatMessage['parts'][number]['type']
    ? Array<Extract<ChatMessage['parts'][number], { type: T }>>
    : ChatMessage['parts'];
}

export const useInternalMessages = () =>
  useChatStore((state) => state.getInternalMessages(), shallow);
export const useChatActions = () =>
  useChatStore(
    (state) => ({
      setMessages: state.setMessages,
      pushMessage: state.pushMessage,
      popMessage: state.popMessage,
      replaceMessage: state.replaceMessage,
      setStatus: state.setStatus,
      setError: state.setError,
      setId: state.setId,
      setNewChat: state.setNewChat,
    }),
    shallow,
  );
export const useSetMessages = () => useChatStore((state) => state.setMessages);
export const useChatHelperStop = () =>
  useChatStore((state) => state.currentChatHelpers?.stop);
export const useMarkdownBlocksForPart = (messageId: string, partIdx: number) =>
  useChatStore((state) => state.getMarkdownBlocksForPart(messageId, partIdx));
export const useMarkdownBlockIndexesForPart = (
  messageId: string,
  partIdx: number,
) =>
  useChatStore((state) =>
    state.getMarkdownBlockCountForPart(messageId, partIdx),
  );
export const useMarkdownBlockCountForPart = (
  messageId: string,
  partIdx: number,
) =>
  useChatStore((state) =>
    state.getMarkdownBlockCountForPart(messageId, partIdx),
  );
export const useMarkdownBlockByIndex = (
  messageId: string,
  partIdx: number,
  blockIdx: number,
) =>
  useChatStore((state) =>
    state.getMarkdownBlockByIndex(messageId, partIdx, blockIdx),
  );
export const useSendMessage = () =>
  useChatStore((state) => state.currentChatHelpers?.sendMessage);

// ZustandChatState instance per provider
const ChatStateContext = createContext<
  ZustandChatState<ChatMessage> | undefined
>(undefined);

export function useChatStateInstance() {
  const state = useContext(ChatStateContext);
  if (!state)
    throw new Error(
      'useChatStateInstance must be used within ChatStateProvider',
    );
  return state;
}
