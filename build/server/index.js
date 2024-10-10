import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, Outlet } from "@remix-run/react";
import * as isbotModule from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { ClientOnly, getTRPCClientLinks, KottsterApp, RootLayout, RootErrorBoundary, usePage, Page } from "@kottster/react";
import { Notifications } from "@mantine/notifications";
import { QueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Modal, TextInput, Button, LoadingOverlay, Table, Group, Grid, Input, Space, Paper, Pagination, Text } from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useForm } from "@mantine/form";
import { Plus, Edit, Trash, Search } from "react-feather";
import { createDataSource, KnexPgAdapter, DataSourceRegistry, createApp } from "@kottster/server";
import { DataSourceType } from "@kottster/common";
import knex from "knex";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  let prohibitOutOfOrderStreaming = isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;
  return prohibitOutOfOrderStreaming ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function isBotRequest(userAgent) {
  if (!userAgent) {
    return false;
  }
  if ("isbot" in isbotModule && typeof isbotModule.isbot === "function") {
    return isbotModule.isbot(userAgent);
  }
  if ("default" in isbotModule && typeof isbotModule.default === "function") {
    return isbotModule.default(userAgent);
  }
  return false;
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const trpc = void 0;
function ClientApp() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false
      }
    }
  }));
  const [trpcClient] = useState(
    () => trpc.createClient({
      links: getTRPCClientLinks()
    })
  );
  return /* @__PURE__ */ jsx(
    KottsterApp.Provider,
    {
      trpc,
      trpcClient,
      queryClient,
      children: /* @__PURE__ */ jsxs(RootLayout, { children: [
        /* @__PURE__ */ jsx(Outlet, {}),
        /* @__PURE__ */ jsx(KottsterApp.OverlayManager, {}),
        /* @__PURE__ */ jsx(Notifications, {})
      ] })
    }
  );
}
function App() {
  return /* @__PURE__ */ jsx(ClientOnly, { children: /* @__PURE__ */ jsx(ClientApp, {}) });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary: RootErrorBoundary,
  Layout: RootLayout,
  default: App
}, Symbol.toStringTag, { value: "Module" }));
function CourierModal({ courierId, onClose }) {
  const mode2 = courierId ? "update" : "create";
  const utils = trpc.useUtils();
  const { data: courierData, isLoading } = trpc.shubham.getCourier.useQuery(
    courierId,
    {
      enabled: mode2 === "update"
    }
  );
  const createCourierMutation = trpc.shubham.createCourier.useMutation({
    onSuccess: () => {
      onClose();
      utils.shubham.getCouriers.refetch();
    }
  });
  const updateCourierMutation = trpc.shubham.updateCourier.useMutation({
    onSuccess: () => {
      onClose();
      utils.shubham.getCouriers.refetch();
    }
  });
  const form = useForm({
    validate: {
      name: (value) => value.length < 3 ? "Name must have at least 2 characters" : null,
      phone: (value) => value.length < 7 ? "Phone must have at least 6 characters" : null,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Invalid email"
    }
  });
  const handleSubmit = (values) => {
    if (mode2 === "update") {
      updateCourierMutation.mutate({ id: courierId, ...values });
    } else {
      createCourierMutation.mutate(values);
    }
    form.reset();
  };
  useEffect(() => {
    form.setValues({
      name: (courierData == null ? void 0 : courierData.name) || "",
      phone: (courierData == null ? void 0 : courierData.phone) || "",
      email: (courierData == null ? void 0 : courierData.email) || ""
    });
  }, [courierData]);
  return /* @__PURE__ */ jsxs(
    Modal,
    {
      opened: true,
      onClose,
      title: mode2 === "update" ? "Edit courier" : "Add courier",
      children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: form.onSubmit(handleSubmit), children: [
          /* @__PURE__ */ jsx(
            TextInput,
            {
              required: true,
              label: "Full Name",
              placeholder: "John Doe",
              mb: "md",
              ...form.getInputProps("name")
            }
          ),
          /* @__PURE__ */ jsx(
            TextInput,
            {
              required: true,
              label: "Phone number",
              placeholder: "(555) 123-4567",
              mb: "md",
              ...form.getInputProps("phone")
            }
          ),
          /* @__PURE__ */ jsx(
            TextInput,
            {
              required: true,
              label: "Email",
              placeholder: "john@example.com",
              ...form.getInputProps("email")
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              mt: "xl",
              leftSection: mode2 === "create" && /* @__PURE__ */ jsx(Plus, { size: 16 }),
              children: mode2 === "update" ? "Save changes" : "Add"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(LoadingOverlay, { visible: mode2 === "update" && isLoading })
      ]
    }
  );
}
function CouriersTable({
  onClickAdd,
  onClickEdit,
  onClickDelete
}) {
  const [queryParams, setQueryParams] = useState({
    search: "",
    page: 1,
    pageSize: 10
  });
  const [debouncedSearch] = useDebouncedValue(queryParams.search, 200);
  const { data, isLoading } = trpc.shubham.getCouriers.useQuery({
    search: debouncedSearch,
    page: queryParams.page,
    pageSize: queryParams.pageSize
  });
  const rows = data == null ? void 0 : data.couriers.map((courier) => /* @__PURE__ */ jsxs(Table.Tr, { children: [
    /* @__PURE__ */ jsx(Table.Td, { children: courier.id }),
    /* @__PURE__ */ jsx(Table.Td, { children: courier.name }),
    /* @__PURE__ */ jsx(Table.Td, { children: courier.phone }),
    /* @__PURE__ */ jsx(Table.Td, { children: courier.email }),
    /* @__PURE__ */ jsx(Table.Td, { p: "xs", children: /* @__PURE__ */ jsxs(Group, { justify: "end", gap: "xs", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "light",
          size: "compact-xs",
          fz: "sm",
          leftSection: /* @__PURE__ */ jsx(Edit, { size: 14 }),
          onClick: () => onClickEdit(courier.id),
          children: "Edit"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "light",
          size: "compact-xs",
          fz: "sm",
          color: "gray",
          onClick: () => onClickDelete(courier.id),
          children: /* @__PURE__ */ jsx(Trash, { size: 14 })
        }
      )
    ] }) })
  ] }, courier.id));
  const handleSearchChange = (e) => {
    setQueryParams((prev) => ({
      ...prev,
      search: e.currentTarget.value,
      page: 1
    }));
  };
  const handlePageChange = (page) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Grid, { justify: "space-between", children: [
      /* @__PURE__ */ jsx(Grid.Col, { span: 3, children: /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Search by full name",
          leftSection: /* @__PURE__ */ jsx(Search, { size: 16 }),
          value: queryParams.search,
          onChange: handleSearchChange
        }
      ) }),
      /* @__PURE__ */ jsx(Grid.Col, { span: "content", children: /* @__PURE__ */ jsx(Button, { leftSection: /* @__PURE__ */ jsx(Plus, { size: 16 }), onClick: onClickAdd, children: "Add courier" }) })
    ] }),
    /* @__PURE__ */ jsx(Space, { h: "lg" }),
    /* @__PURE__ */ jsxs(Paper, { withBorder: true, p: "md", children: [
      /* @__PURE__ */ jsxs(Table.ScrollContainer, { minWidth: 500, pos: "relative", children: [
        /* @__PURE__ */ jsxs(Table, { verticalSpacing: "xs", highlightOnHover: true, children: [
          /* @__PURE__ */ jsx(Table.Thead, { children: /* @__PURE__ */ jsxs(Table.Tr, { children: [
            /* @__PURE__ */ jsx(Table.Th, { fw: "bold", children: "ID" }),
            /* @__PURE__ */ jsx(Table.Th, { fw: "bold", children: "Full name" }),
            /* @__PURE__ */ jsx(Table.Th, { fw: "bold", children: "Phone number" }),
            /* @__PURE__ */ jsx(Table.Th, { fw: "bold", children: "Email" }),
            /* @__PURE__ */ jsx(Table.Th, {})
          ] }) }),
          /* @__PURE__ */ jsx(Table.Tbody, { children: rows })
        ] }),
        /* @__PURE__ */ jsx(LoadingOverlay, { visible: isLoading })
      ] }),
      /* @__PURE__ */ jsx(Space, { h: "xs" }),
      /* @__PURE__ */ jsx(
        Pagination,
        {
          total: Math.ceil(((data == null ? void 0 : data.totalCount) || 0) / queryParams.pageSize),
          value: queryParams.page,
          onChange: handlePageChange
        }
      )
    ] })
  ] });
}
const index = () => {
  const { navItem } = usePage();
  const [updatingUserId, setUpdatingUserId] = useState();
  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => setUpdatingUserId(void 0)
  });
  const utils = trpc.useUtils();
  const deleteCourierMutation = trpc.shubham.deleteCourier.useMutation({
    onSuccess: () => {
      utils.shubham.getCouriers.refetch();
    }
  });
  const handleAddClick = () => {
    open();
  };
  const handleEditClick = (id) => {
    setUpdatingUserId(id);
    open();
  };
  const handleDeleteClick = (id) => {
    modals.openConfirmModal({
      title: "Delete courier",
      children: /* @__PURE__ */ jsx(Text, { size: "sm", children: "Are you sure you want to delete this courier?" }),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteCourierMutation.mutate(id);
      }
    });
  };
  return /* @__PURE__ */ jsxs(Page, { title: navItem.name, children: [
    /* @__PURE__ */ jsx(
      CouriersTable,
      {
        onClickAdd: handleAddClick,
        onClickEdit: handleEditClick,
        onClickDelete: handleDeleteClick
      }
    ),
    opened && /* @__PURE__ */ jsx(CourierModal, { onClose: close, courierId: updatingUserId })
  ] });
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index
}, Symbol.toStringTag, { value: "Module" }));
const dataSource = createDataSource({
  type: DataSourceType.postgres,
  ctxPropName: "knex",
  databaseSchemas: ["public"],
  init: () => {
    const client = knex({
      client: "pg",
      connection: "postgres://postgres:1234@localhost:5432/Myapp",
      searchPath: ["public"]
    });
    return new KnexPgAdapter(client);
  }
});
const dataSourceRegistry = new DataSourceRegistry([
  dataSource
]);
const navItems = [
  {
    id: "shubham",
    name: "Shubham",
    icon: "users"
  }
];
const schema = {
  navItems
};
const app = createApp({
  schema,
  appId: "1591",
  secretKey: "FIns9ugNPQROQrV5QbRzaO60"
  // For security, consider moving the secret key to an environment variable:
  // secretKey: process.env.NODE_ENV === 'development' ? 'dev-secret-key' : process.env.SECRET_KEY,
});
app.registerDataSources(dataSourceRegistry);
const t = initTRPC.context().create();
const couriers = [
  {
    id: 3,
    name: "Bob Johnson",
    phone: "(555) 345-6789",
    email: "bob.johnson@example.com"
  },
  {
    id: 2,
    name: "Jane Smith",
    phone: "(555) 234-5678",
    email: "jane.smith@example.com"
  },
  {
    id: 1,
    name: "John Doe",
    phone: "(555) 123-4567",
    email: "john.doe@example.com"
  }
];
const shubham = t.router({
  getCouriers: t.procedure.input(
    z.object({
      search: z.string().optional(),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive()
    })
  ).query(({ input }) => {
    let filteredCouriers = couriers.filter(
      (courier) => input.search ? courier.name.toLowerCase().includes(input.search.toLowerCase()) : true
    );
    const startIndex = (input.page - 1) * input.pageSize;
    const paginatedCouriers = filteredCouriers.slice(
      startIndex,
      startIndex + input.pageSize
    );
    return {
      couriers: paginatedCouriers,
      totalCount: filteredCouriers.length
    };
  }),
  getCourier: t.procedure.input(z.number()).query(({ input }) => {
    const courier = couriers.find((courier2) => courier2.id === input);
    if (!courier) {
      throw new Error("Courier not found");
    }
    return courier;
  }),
  createCourier: t.procedure.input(
    z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string()
    })
  ).mutation(({ input }) => {
    var _a;
    const id = couriers.length > 0 ? ((_a = couriers[0]) == null ? void 0 : _a.id) + 1 : 1;
    couriers.unshift({ id, ...input });
    return { id };
  }),
  updateCourier: t.procedure.input(
    z.object({
      id: z.number(),
      name: z.string(),
      phone: z.string(),
      email: z.string()
    })
  ).mutation(({ input }) => {
    const courier = couriers.find((courier2) => courier2.id === input.id);
    if (!courier) {
      throw new Error("Courier not found");
    }
    Object.assign(courier, input);
  }),
  deleteCourier: t.procedure.input(z.number()).mutation(({ input }) => {
    const index2 = couriers.findIndex((courier) => courier.id === input);
    if (index2 === -1) {
      throw new Error("Courier not found");
    }
    couriers.splice(index2, 1);
  })
});
const pageRoutes = {
  shubham
};
const appRouter = t.router(pageRoutes ?? []);
console.log("Hy------------------------------------", appRouter);
const loader = async (args) => {
  return app.createServiceRouteLoader(appRouter)(args);
};
const action = async (args) => {
  return app.createServiceRouteLoader(appRouter)(args);
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-18JkCJWM.js", "imports": ["/assets/components-CRzVA0wd.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/root-CYjxCEFT.js", "imports": ["/assets/components-CRzVA0wd.js", "/assets/trpc.client-KA0cA2m9.js"], "css": ["/assets/root-nxQMoCa5.css"] }, "routes/shubham": { "id": "routes/shubham", "parentId": "root", "path": "shubham", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/index-Bw4kGmsK.js", "imports": ["/assets/components-CRzVA0wd.js", "/assets/trpc.client-KA0cA2m9.js"], "css": [] }, "service-route": { "id": "service-route", "parentId": "root", "path": "/-/*", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/service-route-l0sNRNKZ.js", "imports": [], "css": [] } }, "url": "/assets/manifest-3c124573.js", "version": "3c124573" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "unstable_singleFetch": false, "unstable_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/shubham": {
    id: "routes/shubham",
    parentId: "root",
    path: "shubham",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "service-route": {
    id: "service-route",
    parentId: "root",
    path: "/-/*",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
