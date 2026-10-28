import { ImageResponse } from 'next/og';

export const alt = 'Clouse Tools — 67 Free, Fast, Private Online Tools';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0b0e',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(0, 113, 227, 0.22) 0%, transparent 60%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              color: '#0b0b0e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 900,
            }}
          >
            C
          </div>
          <div
            style={{
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Clouse Tools
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            maxWidth: '960px',
            lineHeight: 1.15,
            marginBottom: '24px',
            color: '#f5f5f7',
          }}
        >
          67 Free, Fast &amp; 100% Private Online Utilities
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            color: '#9a9aa2',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            marginBottom: '44px',
          }}
        >
          Math, Text, Date &amp; Time, Unit Converters, Developer Tools, and Design. Zero tracking, zero uploads, computed locally in your browser.
        </div>

        {/* Pill tags */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
          }}
        >
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#86b9ff',
            }}
          >
            ⚡ Zero Server Delay
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#30d158',
            }}
          >
            🔒 100% Private
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Next.js 16
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
