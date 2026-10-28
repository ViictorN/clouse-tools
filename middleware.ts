import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore internal Next.js paths, api routes, and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname) ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  // 1. Alias /pt to /pt-br
  if (pathname === '/pt' || pathname.startsWith('/pt/')) {
    const target = pathname === '/pt' ? '/pt-br' : pathname.replace(/^\/pt/, '/pt-br');
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 307);
  }

  // Determine user's preferred locale
  const detectLocale = (): 'pt-br' | 'en' => {
    // 1. Check user cookie override
    const cookie = request.cookies.get('clouse-locale')?.value;
    if (cookie === 'pt-br' || cookie === 'en') return cookie;

    // 2. Check country header (Vercel, Cloudflare, etc.)
    const country =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-country-code');
    if (country && country.toUpperCase() === 'BR') {
      return 'pt-br';
    }

    // 3. Check Accept-Language header
    const acceptLang = request.headers.get('accept-language') || '';
    if (acceptLang.toLowerCase().includes('pt')) {
      return 'pt-br';
    }

    return 'en';
  };

  // 2. Root path / -> redirect to detected locale
  if (pathname === '/') {
    const locale = detectLocale();
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url, 307);
  }

  // 3. If someone visits routes without locale prefix (e.g. /tools, /about, /tool/xyz)
  if (!pathname.startsWith('/en') && !pathname.startsWith('/pt-br')) {
    const locale = detectLocale();
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, robots, sitemap
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
};
