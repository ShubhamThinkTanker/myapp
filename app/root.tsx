import {
  ClientOnly,
  KottsterApp,
  RootErrorBoundary,
  RootLayout,
  getTRPCClientLinks,
} from '@kottster/react';
import '@kottster/react/dist/style.css';
import { Notifications } from '@mantine/notifications';
import { Outlet } from '@remix-run/react';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc } from './trpc.client';

function ClientApp() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: getTRPCClientLinks(),
    })
  );

  return (
    
    <KottsterApp.Provider
      trpc={trpc}
      trpcClient={trpcClient}
      queryClient={queryClient}
    >
      <RootLayout>
        <Outlet />
        <KottsterApp.OverlayManager />
        <Notifications />
      </RootLayout>
    </KottsterApp.Provider>
  );
}

export default function App() {
  return (
    <ClientOnly>
      <ClientApp />
    </ClientOnly>
  );
}

export { RootErrorBoundary as ErrorBoundary, RootLayout as Layout };
