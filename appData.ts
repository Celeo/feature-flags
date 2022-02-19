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

export interface ApiKey {
  key: string;
  type: "read" | "write" | "admin";
  enabled: boolean;
}

export async function loadAppData(): Promise<Array<Flag>> {
  const data = await Deno.readFile(APP_DATA_FILE_NAME);
  return JSON.parse(new TextDecoder(UTF_8).decode(data)) as Array<Flag>;
}
