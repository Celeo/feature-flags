import { config as loadDotEnv } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
import { DOT_ENV_FILE_NAME, ENV_ADMIN_KEY_NAME, main } from "./src/app.ts";
import { loadAppData } from "./src/appData.ts";

// Entry point
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
