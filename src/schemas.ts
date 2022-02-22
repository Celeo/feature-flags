import { JSONSchemaType } from "./deps.ts";
import { ApiKey, Flag } from "./appData.ts";

export const schemaApiKey: JSONSchemaType<ApiKey> = {
  type: "object",
  properties: {
    key: { type: "string" },
    accessLevel: { type: "string", enum: ["admin", "write", "read"] },
    enabled: { type: "boolean" },
  },
  required: ["key", "accessLevel", "enabled"],
};

export const schemaFlag: JSONSchemaType<Flag> = {
  type: "object",
  properties: {
    tag: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    enabled: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        blue: {
          type: "object",
          properties: {
            value: { type: "boolean" },
            name: { type: "string" },
            description: { type: "string" },
            appliesTo: { type: "array", items: { type: "string" } },
          },
          required: [
            "value",
            "name",
            "description",
            "appliesTo",
          ],
        },
        green: {
          type: "object",
          properties: {
            value: { type: "boolean" },
            name: { type: "string" },
            description: { type: "string" },
            appliesTo: { type: "array", items: { type: "string" } },
          },
          required: [
            "value",
            "name",
            "description",
            "appliesTo",
          ],
        },
        default: { type: "string", enum: ["blue", "green"] },
      },
      required: ["blue", "green", "default"],
    },
  },
  required: [
    "tag",
    "name",
    "description",
    "enabled",
    "data",
  ],
};
