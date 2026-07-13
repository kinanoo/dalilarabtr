export function isPrivateModelSharePath(pathname?: string | null) {
  if (!pathname) return false;
  return /^\/models\/[^/]+/.test(pathname);
}
