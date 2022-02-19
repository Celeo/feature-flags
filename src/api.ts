import Ajv, { JSONSchemaType } from "https://esm.sh/ajv@8.10.0";
import { ApiAccessLevel, ApiKey, AppData, saveAppData } from "./appData.ts";
import { extractAuthHeader, isAuthorized } from "./auth.ts";

const AJV = new Ajv();
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Data and function to receive and respond to an HTTP request.
 */
export interface ApiRoute<T> {
  path: string;
  method: HttpMethod;
  dataShape?: JSONSchemaType<T>;
  level: ApiAccessLevel;
  execute: (
    event: Deno.RequestEvent,
    appData: AppData,
    data: T,
  ) => Promise<void>;
}

/**
 * Route the HTTP request.
 *
 * Handles path matching, method matching, and body schema checking.
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
    matchingRoute.dataShape !== undefined
  ) {
    const body = await event.request.text();
    if (body.length === 0) {
      await event.respondWith(
        new Response(JSON.stringify({ message: "Missing request body" }), {
          status: 400,
        }),
      );
      return;
    }
    const validate = AJV.compile(matchingRoute.dataShape);
    const bodyData = JSON.parse(body);
    if (!validate(bodyData)) {
      await event.respondWith(
        new Response(
          JSON.stringify({
            message: "Invalid request body",
            errors: validate.errors,
          }),
          { status: 400 },
        ),
      );
      return;
    }
    await matchingRoute.execute(
      event,
      appData,
      // @ts-ignore FIXME I don't know why this is complaining
      bodyData,
    );
    return;
  }
  // @ts-ignore FIXME see above
  await matchingRoute.execute(event, appData, null);
}

/**
 * List all auth keys.
 */
const apiGetAllAuthKeys: ApiRoute<null> = {
  path: "/admin/keys",
  method: "GET",
  level: "admin",
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
  ): Promise<void> => {
    await event.respondWith(new Response(JSON.stringify(appData.apiKeys)));
  },
};

/**
 * Add an auth key.
 */
const apiAddAuthKey: ApiRoute<ApiKey> = {
  path: "/admin/keys",
  method: "POST",
  dataShape: {
    type: "object",
    properties: {
      key: { type: "string" },
      accessLevel: { type: "string", enum: ["admin", "write", "read"] },
      enabled: { type: "boolean" },
    },
    required: ["key", "accessLevel", "enabled"],
  },
  level: "admin",
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
    body: ApiKey,
  ): Promise<void> => {
    appData.apiKeys.push(body);
    await saveAppData(appData);
    await event.respondWith(
      new Response(JSON.stringify({ message: "Api key added" })),
    );
  },
};

// more routes ...

const ROUTES = [apiGetAllAuthKeys, apiAddAuthKey];
