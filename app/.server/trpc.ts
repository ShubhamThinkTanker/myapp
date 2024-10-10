import { AppContext } from '@kottster/common';
import { initTRPC } from '@trpc/server';
import { DataSourceContextToClientMap } from './data-sources/registry';

export const t = initTRPC.context<AppContext & DataSourceContextToClientMap>().create();
