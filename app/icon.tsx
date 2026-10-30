import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background:
            'radial-gradient(circle at 50% 18%, rgba(0, 113, 227, 0.38) 0%, transparent 62%), #0b0b0e',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          borderRadius: 7,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.04em',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    }
  );
}
