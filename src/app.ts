import { AppData } from "./appData.ts";
import { route } from "./api.ts";

const PORT = 5000;
export const DOT_ENV_FILE_NAME = ".env";
export const ENV_ADMIN_KEY_NAME = "FEATURE_FLAG_ADMIN_KEY";

/**
 * Starts the listener and receives connections.
 */
export async function main(
  adminApiKey: string,
  appData: AppData,
): Promise<void> {
  appData.apiKeys.push({
    key: adminApiKey,
    accessLevel: "admin",
    enabled: true,
  });
  const listener = Deno.listen({ port: PORT });
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  for await (const connection of listener) {
    try {
      for await (const request of Deno.serveHttp(connection)) {
        handleHttpConnection(request, appData);
      }
    } catch (err) {
      console.error(`Error processing request: ${err}`);
    }
  }
}

/**
 * Handles a single HTTP connection.
 */
async function handleHttpConnection(
  event: Deno.RequestEvent,
  appData: AppData,
): Promise<void> {
  await route(event, appData);
}
