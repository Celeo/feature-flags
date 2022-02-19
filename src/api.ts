import Ajv, { JSONSchemaType } from "https://esm.sh/ajv@8.10.0";
import { ApiAccessLevel, AppData } from "./appData.ts";
import { extractAuthHeader, isAuthorized } from "./auth.ts";

const AJV = new Ajv();
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Route the HTTP request.
 */
export async function route(
  event: Deno.RequestEvent,
  appData: AppData,
): Promise<void> {
  const authKey = extractAuthHeader(event);
  if (authKey === null) {
    await event.respondWith(new Response(null, { status: 401 }));
    return;
  }
  const path = new URL(event.request.url).pathname;
  const method = event.request.method;
  const matchingRoute = ROUTES.find((route) =>
    route.path === path && route.method === method
  );
  if (matchingRoute === undefined) {
    await event.respondWith(
      new Response(
        JSON.stringify({ message: "No route found", path, method }),
        { status: 404 },
      ),
    );
    return;
  }
  if (!isAuthorized(authKey, matchingRoute.level, appData)) {
    await event.respondWith(new Response(null, { status: 403 }));
    return;
  }
  if (
    (method === "POST" || method === "PATCH") &&
    matchingRoute.dataShape !== null
  ) {
    // TODO incoming data shape verification
  }
  await matchingRoute.execute(event, appData);
}

export interface ApiRoute {
  path: string;
  method: HttpMethod;
  dataShape: JSONSchemaType<unknown> | null;
  level: ApiAccessLevel;
  execute: (
    _event: Deno.RequestEvent,
    _appData: AppData,
  ) => Promise<void>;
}

const apiGetAllAuthKeys: ApiRoute = {
  path: "/admin/keys",
  method: "GET",
  dataShape: null,
  level: "admin",
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
  ): Promise<void> => {
    await event.respondWith(new Response(JSON.stringify(appData.apiKeys)));
  },
};

// more routes ...

const ROUTES = [apiGetAllAuthKeys];
