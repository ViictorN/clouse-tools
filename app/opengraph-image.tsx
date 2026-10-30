import { ImageResponse } from 'next/og';

export const alt = 'Clouse Tools — 67 Free, Fast, Private Online Tools';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

/** Social card in the site's own language: OLED ground, calibration grid,
 *  instrument status row, single blue accent. */
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
              backgroundColor: '#ffffff',
              color: '#0b0b0e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >
            C
          </div>
          <div
            style={{
              fontSize: '30px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#f5f5f7',
            }}
          >
            Clouse Tools
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
            uploads, computed entirely in your browser.
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
