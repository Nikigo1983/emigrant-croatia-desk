export function appendSharedDriveParams(url: URL) {
  url.searchParams.set("supportsAllDrives", "true");
}

export function sharedDriveHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}
