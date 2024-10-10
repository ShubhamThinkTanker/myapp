import { t } from '../trpc';
import pageRoutes from './page-routers.generated';

export const appRouter = t.router(pageRoutes ?? []);
console.log('Hy------------------------------------', appRouter);
export type AppRouter = typeof appRouter;
