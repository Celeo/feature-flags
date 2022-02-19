const APP_DATA_FILE_NAME = "data.json";
const UTF_8 = "utf-8";

export interface FlagPart<T> {
  value: T;
  name: string;
  description: string;
  appliesTo: Array<string>;
}

export interface BooleanFlagData {
  blue: FlagPart<boolean>;
  green: FlagPart<boolean>;
  default: "blue" | "green";
}

export interface Flag {
  tag: string;
  name: string;
  description: string;
  enabled: boolean;
  data: BooleanFlagData;
}

export type ApiAccessLevel = "read" | "write" | "admin";

export interface ApiKey {
  key: string;
  accessLevel: ApiAccessLevel;
  enabled: boolean;
}

export interface AppData {
  flags: Array<Flag>;
  apiKeys: Array<ApiKey>;
}

/**
 * Load app data from the file system.
 */
export async function loadAppData(): Promise<AppData> {
  try {
    const stat = await Deno.lstat(APP_DATA_FILE_NAME);
    if (!stat.isFile) {
      console.log(`${APP_DATA_FILE_NAME} file not found`);
      return { flags: [], apiKeys: [] };
    }
  } catch (_err) {
    console.log(`Could not read from ${APP_DATA_FILE_NAME} file`);
    return { flags: [], apiKeys: [] };
  }
  const text = await Deno.readFile(APP_DATA_FILE_NAME);
  return JSON.parse(new TextDecoder(UTF_8).decode(text)) as AppData;
}

/**
 * Save app data to the file system.
 */
export async function saveAppData(appData: AppData): Promise<void> {
  const text = new TextEncoder().encode(JSON.stringify(appData, null, 2));
  await Deno.writeFile(APP_DATA_FILE_NAME, text);
}
