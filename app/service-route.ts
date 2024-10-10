import { app } from '@/.server/app';
import { appRouter } from '@/.server/trpc-routers/app-router';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

export const loader = async (args: LoaderFunctionArgs) => {
  return app.createServiceRouteLoader(appRouter)(args);
};

export const action = async (args: ActionFunctionArgs) => {
  return app.createServiceRouteLoader(appRouter)(args);
};