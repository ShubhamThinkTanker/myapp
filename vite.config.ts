import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route('/-/*', 'service-route.ts');
        });
      },
    }),
    tsconfigPaths(),
    viteCommonjs({
      include: ['util'],
    }),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-feather',
      '@mantine/core',
      '@mantine/dates',
      '@mantine/charts',
      '@mantine/hooks',
      '@mantine/modals',
      '@mantine/form',
      '@mantine/notifications',
      '@tanstack/react-query',
      '@trpc/react-query',
      'dayjs',
      'recharts',
    ],
    exclude: ['@kottster/react'],
  },
});