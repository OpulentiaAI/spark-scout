import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';
import { verifySameOrigin, jsonError } from '@/lib/security';

const handler = (req: Request) => {
  if (req.method !== 'GET') {
    const originCheck = verifySameOrigin(req);
    if (!originCheck.ok) return jsonError(403, 'Forbidden: origin not allowed');
  }
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
};
export { handler as GET, handler as POST };
