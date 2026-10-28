# CLOUSE TOOLS — 67 free online tools, maximum level

Multi-page, zero-backend website with 67 fully functional tools that run 100% in the browser.

## How to open
- **Easiest:** double-click `index.html` (works from file:// — everything is local except CDN fonts/GSAP, which degrade gracefully offline).
- **Local server (recommended):**
  ```
  node _server.cjs
  ```
  then open http://localhost:8765

## Pages
| File | Content |
|---|---|
| `index.html` | Homepage — hero, search, popular tools, dark band, categories (matches the reference screenshots) |
| `tools.html` | All 67 tools with category filters |
| `category.html?cat=math` | Category page (math, text, date, converters, developer, design) |
| `tool.html?tool=percentage-calculator` | Any tool page — all 67 work |
| `search.html?q=image` | Search results with empty state |
| `about.html`, `terms.html`, `privacy.html` | Content pages |
| `components.html` | Design-system showcase (view 10 of the reference) |

## Architecture
```
css/style.css     — design system (tokens, glass nav, dark band, responsive, reduced-motion)
js/icons.js       — 88 inline Tabler SVGs (fetched via Iconify MCP)
js/data.js        — catalog: 6 categories, 67 tools, search engine
js/tool-engine.js — all 67 tool implementations (pure client-side)
js/main.js        — chrome, Ctrl+K palette, Lenis + GSAP motion, cursor, magnetic, spotlight
```

## Tech
Vanilla HTML/CSS/JS + GSAP 3.13 (SplitText, ScrollTrigger), Lenis smooth scroll, Inter + JetBrains Mono. No build step, no framework, no backend — private by design.

## Shortcuts
- `Ctrl + K` (or `/`) — command palette search
- `Esc` — close search
- Full keyboard support in the palette (arrows + Enter)

## Verified
- 67/67 tools render and compute (percentage, date diff, unit conversion, Base64, SHA-256 against official test vector, password entropy, word count...)
- Mobile 390px, 430px, 640px, 900px, 1080px breakpoints
- prefers-reduced-motion, skip links, AA contrast, zero console errors

## Screenshots

| Desktop hero | Dark band | Tool page | Mobile |
|---|---|---|---|
| ![](screenshots/shot-01-home-hero.png) | ![](screenshots/shot-03-dark-band.png) | ![](screenshots/shot-05-tool-page.png) | ![](screenshots/shot-07-mobile-home.png) |
