# CLOUSE TOOLS — 67 Free Online Tools

[![CI / Build Verification](https://github.com/ViictorN/clouse-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/ViictorN/clouse-tools/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Backend-100%25%20Client--Side-emerald)](#)

Modern Next.js 16 App Router platform featuring **67 fully functional tools** that run 100% inside your browser — zero tracking, zero telemetry, instant execution, and Apple-grade craft.

---

## ⚡ Quick Start

### Development
```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Preview
```bash
# Build optimized production bundle with full Static Site Generation (82 SSG routes)
npm run build

# Start Next.js production server locally
npm start
```

---

## 🚀 Deploy to Vercel

The project is natively optimized for **[Vercel](https://vercel.com)**:
- Framework is auto-detected as **Next.js**.
- `next.config.mjs` configures production compression, Strict Mode, and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
- All 67 tool pages and 6 category pages are statically pre-rendered (`generateStaticParams`) for sub-millisecond TTFB.

To deploy:
1. Push this repository to GitHub: `https://github.com/ViictorN/clouse-tools.git`
2. In Vercel, click **Add New Project** and select `ViictorN/clouse-tools`.
3. Click **Deploy**! Vercel runs `npm run build` and distributes across global Edge networks.

---

## 🧭 Next.js App Router Architecture

| Route | Type | Description |
|---|---|---|
| `/` | Static (SSG) | Homepage — hero, live search, popular tools, dark feature band, category grid |
| `/tools` | Static (SSG) | Complete directory of all 67 tools with live category and text filters |
| `/category/[slug]` | SSG (6 paths) | Dynamic category landing pages (`math`, `text`, `date`, `converters`, `developer`, `design`) |
| `/tool/[slug]` | SSG (67 paths) | Dedicated tool pages with custom SEO metadata, JSON-LD schema, and interactive engine |
| `/search` | Dynamic Client | Live instant search with keyword scoring across names, keywords, and blurbs |
| `/about` | Static (SSG) | About Clouse Tools, mission, and architecture overview |
| `/components` | Static (SSG) | Interactive design system and token showcase |
| `/privacy` | Static (SSG) | Client-side privacy statement |
| `/terms` | Static (SSG) | Terms of use |

---

## 🛠️ Complete Tools Catalog (67 Tools)

### 1. Math Tools (14)
- **Percentage Calculator** (`percentage-calculator`): Three-mode percentage calculations.
- **Percentage Change** (`percentage-change`): Absolute and relative increase/decrease.
- **Average Calculator** (`average-calculator`): Mean, median, mode, range, and sum.
- **Random Number Generator** (`random-number-generator`): Cryptographically secure random integers.
- **Number Base Converter** (`number-base-converter`): Binary, octal, decimal, and hexadecimal.
- **Ratio Calculator** (`ratio-calculator`): Simplifies ratios and computes equivalent fourth terms.
- **LCM & GCD Calculator** (`lcm-gcd-calculator`): Least common multiple and greatest common divisor.
- **Rounding Calculator** (`rounding-calculator`): Standard, floor, ceiling, and precision rounding.
- **Prime Number Checker** (`prime-number-checker`): Primality test and factor listing.
- **Square Root Calculator** (`square-root-calculator`): Principal square root and nearest perfect squares.
- **Discount Calculator** (`discount-calculator`): Final sale price and total amount saved.
- **Tip Calculator** (`tip-calculator`): Custom tip percentage with split bill per person.
- **BMI Calculator** (`bmi-calculator`): Body mass index with WHO category classification.
- **Loan Calculator** (`loan-calculator`): Monthly amortization, total payment, and total interest.

### 2. Text Tools (11)
- **Word Counter** (`word-counter`): Words, characters, sentences, paragraphs, and reading time.
- **Case Converter** (`case-converter`): UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case.
- **Text Reverser** (`text-reverser`): Reverse by character, word, or line.
- **Slug Generator** (`slug-generator`): URL-safe slugs with customizable delimiters.
- **Lorem Ipsum Generator** (`lorem-ipsum-generator`): Placeholder paragraphs, sentences, and words.
- **Duplicate Line Remover** (`duplicate-line-remover`): Deduplication with case sensitivity options.
- **Text Sorter** (`text-sorter`): Alphabetical, reverse, length-based, and numeric sorting.
- **Find and Replace** (`find-and-replace`): Plain text and regex search & replace.
- **Readability Analyzer** (`readability-analyzer`): Flesch Reading Ease score and grade level.
- **Text Diff Checker** (`text-diff-checker`): Line-by-line visual diff comparison.
- **Accent Remover** (`accent-remover`): Strips diacritics via Unicode normalization.

### 3. Date & Time Tools (10)
- **Date Difference** (`date-difference`): Days, weeks, months, and years between dates.
- **Age Calculator** (`age-calculator`): Exact age in years, months, and days.
- **Add / Subtract Days** (`add-subtract-days`): Calendar arithmetic with business day calculation.
- **Week Number Calculator** (`week-number-calculator`): ISO-8601 week number and day-of-year.
- **Countdown Timer** (`countdown-timer`): Visual live countdown with audio chime.
- **Stopwatch** (`stopwatch`): Millisecond accuracy with lap splits.
- **Timestamp Converter** (`timestamp-converter`): Unix epoch seconds/milliseconds to ISO-8601.
- **Timezone Converter** (`timezone-converter`): Multi-city world clock comparisons.
- **Days Until** (`days-until`): Countdown to holidays and milestones.
- **Current Time & World Clock** (`current-time`): Live atomic time with timezone offsets.

### 4. Unit Converters (11)
- **Length Converter** (`length-converter`): Metric and imperial distances.
- **Weight Converter** (`weight-converter`): Kilograms, pounds, ounces, grams, stones.
- **Temperature Converter** (`temperature-converter`): Celsius, Fahrenheit, Kelvin.
- **Area Converter** (`area-converter`): Square meters, feet, acres, hectares.
- **Volume Converter** (`volume-converter`): Liters, gallons, fluid ounces, cubic meters.
- **Speed Converter** (`speed-converter`): km/h, mph, m/s, knots, Mach.
- **Data Storage Converter** (`data-storage-converter`): Bits, bytes, KB, MB, GB, TB, PB.
- **Time Units Converter** (`time-units-converter`): Seconds, minutes, hours, days, years.
- **Energy Converter** (`energy-converter`): Joules, calories, kWh, BTU, electronvolts.
- **Angle Converter** (`angle-converter`): Degrees, radians, gradians, arcminutes.
- **Universal Unit Converter** (`unit-converter`): Multi-unit switcher covering all dimensions.

### 5. Developer Tools (12)
- **Base64 Encoder / Decoder** (`base64-encoder`): UTF-8 safe encoding and decoding.
- **JSON Formatter & Validator** (`json-formatter`): Formats, compacts, and validates JSON with syntax errors.
- **URL Encoder / Decoder** (`url-encoder`): Safe URI query string and path transformation.
- **HTML Entity Encoder** (`html-entity-encoder`): Escapes and unescapes reserved HTML entities.
- **Regex Tester** (`regex-tester`): Real-time regex pattern matcher with flags and match highlights.
- **Hash Generator** (`hash-generator`): SHA-256, SHA-1, SHA-384, SHA-512 via Web Crypto API.
- **UUID Generator** (`uuid-generator`): Generates RFC 4122 v4 UUIDs using cryptographically secure random values.
- **Password Generator** (`password-generator`): Strong passwords with custom lengths and entropy score.
- **Markdown Previewer** (`markdown-previewer`): Live split-screen markdown editor and rendered preview.
- **CSS Minifier** (`css-minifier`): Strips comments and whitespace for production CSS.
- **JWT Decoder** (`jwt-decoder`): Decodes header and payload with human-readable timestamps.
- **CSV to JSON Converter** (`csv-to-json`): Parses CSV table format into structured JSON objects.

### 6. Design Tools (9)
- **Image Resizer** (`image-resizer`): Client-side Canvas image scaling with aspect ratio locking.
- **Image Compressor** (`image-compressor`): Adjustable JPEG/WebP quality compression in-memory.
- **Color Converter** (`color-converter`): Synchronized HEX, RGB, HSL conversions with swatch preview.
- **CSS Gradient Generator** (`gradient-generator`): Linear and radial gradient builder with CSS export.
- **Box Shadow Generator** (`shadow-generator`): Multi-layer ambient box-shadow builder.
- **QR Code Generator** (`qr-code-generator`): Generates customizable QR codes with PNG download.
- **Favicon Generator** (`favicon-generator`): Generates 16x16, 32x32, 48x48, and 180x180 icons.
- **Color Palette Extractor** (`color-palette-extractor`): Quantizes dominant palette colors from uploaded images.
- **Aspect Ratio Calculator** (`aspect-ratio-calculator`): Standard ratios (16:9, 4:3, 1:1, 21:9) and dimension solver.

---

## 🔒 Security & Privacy

- **100% Client-Side:** No uploaded files or sensitive data ever leave your machine.
- **No External Trackers:** No Google Analytics, no Facebook Pixels, no advertising beacons.
- **Security Headers:** Strict Content-Type sniffing prevention, Frame deny, and XSS protection.

---

## 📄 License

MIT © [Victor Gomes](https://github.com/ViictorN)
