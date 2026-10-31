/**
 * Centralized site configuration and canonical URL resolver.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clouse-tools.vercel.app';

export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}
