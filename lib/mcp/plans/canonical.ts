const encoder = new TextEncoder();

/** RFC 8785 representation for the closed JSON value domain used by plans. */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite JSON number");
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    for (const char of value) {
      const code = char.codePointAt(0)!;
      if (code >= 0xd800 && code <= 0xdfff) throw new Error("Unpaired Unicode surrogate");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${canonicalize(key)}:${canonicalize((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  throw new Error("Unsupported JSON value");
}

export async function digest(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalize(value)));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomChallenge(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
