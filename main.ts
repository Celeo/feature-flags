import { main } from "./src/app.ts";
import { loadAppData } from "./src/appData.ts";

// Entry point
if (import.meta.main) {
  const appData = await loadAppData();
  await main(appData);
}
