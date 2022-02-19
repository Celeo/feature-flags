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
  const data = await Deno.readFile(APP_DATA_FILE_NAME);
  return JSON.parse(new TextDecoder(UTF_8).decode(data)) as AppData;
}
