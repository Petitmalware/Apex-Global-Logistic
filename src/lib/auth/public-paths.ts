import { AUTH_PUBLIC_PATHS } from "@/lib/auth/constants";

const publicTrackingReceiptPattern = /^\/tracking\/[^/]+\/receipt$/;

export function isPublicPagePath(pathname: string) {
  return (
    AUTH_PUBLIC_PATHS.some((path) => pathname === path) ||
    publicTrackingReceiptPattern.test(pathname)
  );
}
