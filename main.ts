import { config as loadDotEnv } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
import { Flag, loadAppData } from "./appData.ts";

const PORT = 5000;
const DOT_ENV_FILE_NAME = ".env";
const ENV_ADMIN_KEY_NAME = "FEATURE_FLAG_ADMIN_KEY";

/**
 * Starts the listener and receives connections.
 */
async function main(adminApiKey: string, flags: Array<Flag>): Promise<void> {
  const listener = Deno.listen({ port: PORT });
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  for await (const connection of listener) {
    try {
      for await (const request of Deno.serveHttp(connection)) {
        handleHttpConnection(request, adminApiKey, flags);
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
  request: Deno.RequestEvent,
  _adminApiKey: string,
  _flags: Array<Flag>,
): Promise<void> {
  // TODO
  await request.respondWith(new Response("It works", { status: 200 }));
}

// entry point
if (import.meta.main) {
  const appData = await loadAppData();
  try {
    const stat = await Deno.lstat(DOT_ENV_FILE_NAME);
    if (!stat.isFile) {
      console.error(`${DOT_ENV_FILE_NAME} file missing`);
      Deno.exit(1);
    }
  } catch (_) {
    console.error(`${DOT_ENV_FILE_NAME} file missing`);
    Deno.exit(1);
  }
  const dotenv = loadDotEnv();
  if (!(ENV_ADMIN_KEY_NAME in dotenv)) {
    console.error(`${DOT_ENV_FILE_NAME} file missing ${ENV_ADMIN_KEY_NAME}`);
    Deno.exit(1);
  }
  const adminApiKey = dotenv[ENV_ADMIN_KEY_NAME];
  await main(adminApiKey, appData);
}
