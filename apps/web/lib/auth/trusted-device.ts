export const TRUSTED_DEVICE_COOKIE = "elsewhere_trusted_device";

export type TrustedDeviceMode = "persistent" | "session";

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

export function trustedDeviceMode(value: string | undefined): TrustedDeviceMode {
  // Existing sessions predate the preference cookie. Preserve them until the
  // user makes an explicit choice at their next sign-in.
  return value === "0" ? "session" : "persistent";
}

export function applyTrustedDeviceLifetime<T extends CookieOptions>(
  options: T,
  preference: string | undefined,
): T {
  if (options.maxAge === 0 || trustedDeviceMode(preference) === "persistent") {
    return options;
  }

  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return sessionOptions;
}

function cookieValue(name: string) {
  if (typeof document === "undefined") return undefined;
  const encodedName = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));
  if (!match) return undefined;
  try {
    return decodeURIComponent(match.slice(encodedName.length));
  } catch {
    return match.slice(encodedName.length);
  }
}

function serializeBrowserCookie(name: string, value: string, options: CookieOptions) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const sameSite = options.sameSite === true ? "Strict" : options.sameSite;
    parts.push(`SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`);
  }
  return parts.join("; ");
}

export function setTrustedDevicePreference(remember: boolean) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const lifetime = remember ? "; Max-Age=31536000" : "";
  document.cookie = `${TRUSTED_DEVICE_COOKIE}=${remember ? "1" : "0"}; Path=/; SameSite=Lax${lifetime}${secure}`;
}

export function clearTrustedDevicePreference() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TRUSTED_DEVICE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export const browserAuthCookies = {
  getAll() {
    if (typeof document === "undefined" || !document.cookie) return [];
    return document.cookie.split(";").flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return [];
      const rawName = part.slice(0, separator).trim();
      const rawValue = part.slice(separator + 1);
      try {
        return [{ name: decodeURIComponent(rawName), value: decodeURIComponent(rawValue) }];
      } catch {
        return [{ name: rawName, value: rawValue }];
      }
    });
  },
  setAll(cookies: Array<{ name: string; value: string; options: CookieOptions }>) {
    if (typeof document === "undefined") return;
    const preference = cookieValue(TRUSTED_DEVICE_COOKIE);
    for (const cookie of cookies) {
      const options = applyTrustedDeviceLifetime(cookie.options, preference);
      document.cookie = serializeBrowserCookie(cookie.name, cookie.value, {
        ...options,
        secure: options.secure ?? window.location.protocol === "https:",
      });
    }
  },
};
