import { ApiAccessLevel, AppData } from "./appData.ts";
import { extractAuthHeader, isAuthorized } from "./auth.ts";

/**
 * Route the HTTP request.
 */
export async function route(
  event: Deno.RequestEvent,
  adminApiKey: string,
  appData: AppData,
): Promise<void> {
  const authKey = extractAuthHeader(event);
  if (authKey === null) {
    await event.respondWith(new Response(null, { status: 401 }));
    return;
  }
  const path = new URL(event.request.url).pathname;
  const matchingRoute = ROUTES.find((route) => route.path === path);
  if (matchingRoute === undefined) {
    await event.respondWith(
      new Response(JSON.stringify({ message: "No route found" }), {
        status: 404,
      }),
    );
    return;
  }
  if (!isAuthorized(authKey, matchingRoute.level, adminApiKey, appData)) {
    await event.respondWith(new Response(null, { status: 403 }));
    return;
  }
  await matchingRoute.execute(event, adminApiKey, appData);
}

export interface ApiRoute {
  path: string;
  level: ApiAccessLevel;
  execute: (
    _event: Deno.RequestEvent,
    _adminApiKey: string,
    _appData: AppData,
  ) => Promise<void>;
}

const apiViewAllKeys: ApiRoute = {
  path: "/admin/keys",
  level: "admin",
  execute: async (
    event: Deno.RequestEvent,
    _adminApiKey: string,
    _appData: AppData,
  ): Promise<void> => {
    await event.respondWith(new Response(JSON.stringify([])));
  },
};

// more routes ...

const ROUTES = [apiViewAllKeys];
