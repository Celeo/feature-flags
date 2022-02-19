import { ApiAccessLevel, AppData } from "./appData.ts";

const AUTHORIZATION_HEADER = "authorization";

/**
 * Retrieve the auth key (if it exists) in the event headers.
 */
export function extractAuthHeader(
  event: Deno.RequestEvent,
): string | null {
  return event.request.headers.get(AUTHORIZATION_HEADER);
}

/**
 * Determine if the authorization key provided and requested
 * access level is authorized.
 */
export function isAuthorized(
  keyInUse: string,
  requestedLevel: ApiAccessLevel,
  appData: AppData,
): boolean {
  const matchingEntry = appData.apiKeys.find((entry) => entry.key === keyInUse);
  if (matchingEntry === undefined) {
    return false;
  }
  if (matchingEntry.accessLevel === "admin") {
    return true;
  }
  if (matchingEntry.accessLevel === requestedLevel) {
    return true;
  }
  if (matchingEntry.accessLevel === "write" && requestedLevel === "read") {
    return true;
  }
  return false;
}
