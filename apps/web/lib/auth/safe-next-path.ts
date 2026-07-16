export function safeNextPath(
  requestedPath: string | null | undefined,
  fallback = "/app/dashboard",
): string {
  if (
    !requestedPath?.startsWith("/") ||
    requestedPath.startsWith("//") ||
    requestedPath.includes("\\") ||
    /%5c/i.test(requestedPath) ||
    /[\u0000-\u001f\u007f]/.test(requestedPath)
  ) {
    return fallback;
  }

  return requestedPath;
}
