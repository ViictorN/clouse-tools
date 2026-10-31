import { ImageResponse } from 'next/og';

export const alt = 'Clouse Tools — 67 Free, Fast, Private Online Tools';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

/** Social card in the site's own language: OLED ground, calibration grid,
 *  instrument status row, single blue accent, vector squircle brand mark. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0b0b0e',
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 78% -10%, rgba(0, 113, 227, 0.28) 0%, transparent 62%),' +
            'linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
          color: '#ffffff',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: '64px 72px',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: '#0b0b0e',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 3.5C14.5 1.5 11 1.8 8.8 4L4 8.8C1.8 11 1.5 14.5 3.5 17C5.5 19.5 9 19.2 11.2 17L16 12.2C18.2 10 18.5 6.5 16.5 4"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.5 14.5L19.5 19.5"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="9" cy="9" r="1.5" fill="#ffffff" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '30px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#f5f5f7',
            }}
          >
            CLOUSE TOOLS
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#86b9ff',
            }}
          >
            ● 67 client-side utilities
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '880px' }}>
          <div
            style={{
              fontSize: '78px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: '#f5f5f7',
              marginBottom: '22px',
            }}
          >
            Everything you need. In one place.
          </div>
          <div
            style={{
              fontSize: '25px',
              color: '#9a9aa2',
              lineHeight: 1.4,
              maxWidth: '760px',
            }}
          >
            Math, text, dates, converters, developer tools and design. Zero tracking, zero
            telemetry, computed 100% inside your browser.
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            { value: '67', label: 'tools ready', tone: '#f5f5f7' },
            { value: '100%', label: 'local compute', tone: '#30d158' },
            { value: '0', label: 'sign-ups required', tone: '#f5f5f7' },
            { value: '0ms', label: 'server delay', tone: '#86b9ff' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div
                style={{
                  fontSize: '34px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: item.tone,
                }}
              >
                {item.value}
              </div>
              <div style={{ fontSize: '17px', color: '#9a9aa2' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
