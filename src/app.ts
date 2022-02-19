import { AppData, saveAppData } from "./appData.ts";
import { route } from "./api.ts";

const PORT = 5000;

/**
 * Starts the listener and receives connections.
 */
export async function main(
  appData: AppData,
): Promise<void> {
  if (appData.apiKeys.length === 0) {
    console.log("No defined API keys, creating an admin key and saving");
    appData.apiKeys.push({
      key: crypto.randomUUID(),
      accessLevel: "admin",
      enabled: true,
    });
    await saveAppData(appData);
  }
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
