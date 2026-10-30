# `apps/web` — Portal Frontend Descriptor

Per **Section 3 of `arquitetura.pdf`**, `apps/web` corresponds to the CLOUSE TOOLS Next.js 16 Portal & Client-Side Tool Engine.

To preserve zero-configuration Vercel deployment (`vercel.json` `"framework": "nextjs"`), the Next.js App Router lives at the repository root:
- **Pages & Localized Routes:** `app/[locale]/*` (`pt-br` and `en`) + root route aliases
- **Unified API v1 Bridge:** `app/api/v1/[[...route]]/route.ts` (delegating to `apps/api/src/gateway-handlers.ts`)
- **67 Client-Side Browser Tools:** `lib/tool-engine.ts` and `lib/data.ts`
- **Design System & Apple HIG Tokens:** `app/globals.css` and `components/*`
