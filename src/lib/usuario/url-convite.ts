import "server-only";

export function urlDoConvite(linkConvite: string): string {
  const baseURL = process.env.BETTER_AUTH_URL;
  return baseURL ? new URL(linkConvite, baseURL).toString() : linkConvite;
}
