import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/.server/trpc-routers/app-router';
export const trpc = createTRPCReact<AppRouter>();
