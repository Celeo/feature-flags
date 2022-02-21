import { Ajv, JSONSchemaType } from "./deps.ts";
import { excludeKeys, sendResponse } from "./util.ts";
import {
  ApiAccessLevel,
  ApiKey,
  AppData,
  FlagPart,
  saveAppData,
} from "./appData.ts";
import { extractAuthHeader, isAuthorized } from "./auth.ts";

const AJV = new Ajv();
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

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
  dataShape: {
    type: "object",
    properties: {
      key: { type: "string" },
      accessLevel: { type: "string", enum: ["admin", "write", "read"] },
      enabled: { type: "boolean" },
    },
    required: ["key", "accessLevel", "enabled"],
  },
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

    async function showFlag(part: FlagPart<unknown>) {
      const trimmed = excludeKeys({ ...part }, ["appliesTo"]);
      await sendResponse(event, trimmed);
    }

    const target = url.searchParams.get("target");
    if (target === null) {
      await showFlag(matchingFlag.data[matchingFlag.data.default]);
      return;
    }
    const notDefaultFlag = matchingFlag
      .data[matchingFlag.data.default === "green" ? "blue" : "green"];
    if (notDefaultFlag.appliesTo.includes(target)) {
      await showFlag(notDefaultFlag);
    } else {
      await showFlag(matchingFlag.data[matchingFlag.data.default]);
    }
  },
};

const ROUTES = [
  apiGetAllAuthKeys,
  apiAddAuthKey,
  // apiViewAllFlags,
  // apiAddFlag,
  apiCheckFlag,
];
