import { Ajv, JSONSchemaType } from "./deps.ts";
import { sendResponse } from "./util.ts";
import {
  ApiAccessLevel,
  ApiKey,
  AppData,
  Flag,
  saveAppData,
} from "./appData.ts";
import { extractAuthHeader, isAuthorized } from "./auth.ts";
import { schemaApiKey, schemaFlag } from "./schemas.ts";

const AJV = new Ajv();
type HttpMethod = "GET" | "POST" | "DELETE";

/**
 * Data and function to receive and respond to an HTTP request.
 */
export interface ApiRoute<T> {
  path: string;
  method: HttpMethod;
  level: ApiAccessLevel;
  dataShape?: JSONSchemaType<T>;
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
    await sendResponse(event, null, 401);
    return;
  }
  const path = new URL(event.request.url).pathname;
  const method = event.request.method;
  const matchingRoute = ROUTES.find((route) =>
    route.path === path && route.method === method
  );
  if (matchingRoute === undefined) {
    await sendResponse(event, { message: "No route found", path, method }, 404);
    return;
  }
  if (!isAuthorized(authKey, matchingRoute.level, appData)) {
    await sendResponse(event, null, 403);
    return;
  }
  if (
    (method === "POST" || method === "PATCH") &&
    matchingRoute.dataShape !== undefined
  ) {
    const body = await event.request.text();
    if (body.length === 0) {
      await sendResponse(event, { message: "Missing request body" }, 400);
      return;
    }
    const validate = AJV.compile(matchingRoute.dataShape);
    const bodyData = JSON.parse(body);
    if (!validate(bodyData)) {
      await sendResponse(event, {
        message: "Invalid request body",
        errors: validate.errors,
      }, 400);
      return;
    }
    // @ts-ignore I cannot find out why T is 'never' here
    await matchingRoute.execute(event, appData, bodyData);
    return;
  }
  // @ts-ignore I cannot find out why T is 'never' here
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
    await sendResponse(event, appData.apiKeys);
  },
};

/**
 * Add an auth key.
 */
const apiAddAuthKey: ApiRoute<ApiKey> = {
  path: "/admin/keys",
  method: "POST",
  level: "admin",
  dataShape: schemaApiKey,
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
    body: ApiKey,
  ): Promise<void> => {
    appData.apiKeys.push(body);
    await saveAppData(appData);
    await sendResponse(event, { message: "Api key added" });
  },
};

const apiRemoveAuthKey: ApiRoute<null> = {
  path: "/admin/keys",
  method: "DELETE",
  level: "admin",
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
  ): Promise<void> => {
    const url = new URL(event.request.url);
    const key = url.searchParams.get("key");
    if (key === null) {
      await sendResponse(event, { message: "No key specified" }, 404);
      return;
    }
    const currentLength = appData.apiKeys.length;
    appData.apiKeys = appData.apiKeys.filter((apiKey) => apiKey.key !== key);
    if (appData.apiKeys.length === currentLength) {
      await sendResponse(event, { message: "Key not found" }, 404);
      return;
    }
    await saveAppData(appData);
    await sendResponse(event, { message: "API key removed", key });
  },
};

/**
 * View all flags.
 */
const apiViewAllFlags: ApiRoute<null> = {
  path: "/flags",
  method: "GET",
  level: "read",
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
  ): Promise<void> => {
    await sendResponse(event, appData.flags);
  },
};

/**
 * Get the value of a flag by tag and optional target.
 */
const apiCheckFlag: ApiRoute<null> = {
  path: "/flag",
  method: "GET",
  level: "read",
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
  ): Promise<void> => {
    const url = new URL(event.request.url);
    const tag = url.searchParams.get("tag");
    if (tag === null) {
      await sendResponse(event, { message: "No tag supplied" }, 404);
      return;
    }
    const matchingFlag = appData.flags.find((flag) => flag.tag === tag);
    if (matchingFlag === undefined) {
      await sendResponse(
        event,
        { message: "No flag supplied found", tag },
        404,
      );
      return;
    }

    const target = url.searchParams.get("target");
    if (target === null) {
      await sendResponse(
        event,
        matchingFlag.data[matchingFlag.data.default].value,
      );
      return;
    }
    const notDefaultFlag = matchingFlag
      .data[matchingFlag.data.default === "green" ? "blue" : "green"];
    if (notDefaultFlag.appliesTo.includes(target)) {
      await sendResponse(event, notDefaultFlag.value);
    } else {
      await sendResponse(
        event,
        matchingFlag.data[matchingFlag.data.default].value,
      );
    }
  },
};

/**
 * Add a new flag.
 */
const apiAddFlag: ApiRoute<Flag> = {
  path: "/flags",
  method: "POST",
  level: "write",
  dataShape: schemaFlag,
  execute: async (
    event: Deno.RequestEvent,
    appData: AppData,
    body: Flag,
  ): Promise<void> => {
    appData.flags.push(body);
    await saveAppData(appData);
    await sendResponse(event, { message: "Api key added" });
  },
};

const ROUTES = [
  apiGetAllAuthKeys,
  apiAddAuthKey,
  apiRemoveAuthKey,
  apiViewAllFlags,
  apiAddFlag,
  apiCheckFlag,
];
