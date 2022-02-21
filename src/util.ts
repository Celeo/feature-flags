/**
 * Send a JSON response.
 */
export async function sendResponse(
  event: Deno.RequestEvent,
  data: unknown,
  status = 200,
): Promise<void> {
  await event.respondWith(
    new Response(data === null ? null : JSON.stringify(data), { status }),
  );
}

/**
 * Exclude keys from a `Record`.
 */
export function excludeKeys(
  data: { [_: string]: unknown },
  keys: Array<string>,
): Record<string, unknown> {
  const copy: Record<string, unknown> = {};
  Object.keys(data)
    .filter((key) => !keys.includes(key))
    .forEach((key) => copy[key] = data[key]);
  return copy;
}
