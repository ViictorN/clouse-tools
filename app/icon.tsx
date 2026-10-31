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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0b0e',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 3.5C14.5 1.5 11 1.8 8.8 4L4 8.8C1.8 11 1.5 14.5 3.5 17C5.5 19.5 9 19.2 11.2 17L16 12.2C18.2 10 18.5 6.5 16.5 4"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 14.5L19.5 19.5"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="9" cy="9" r="1.6" fill="#ffffff" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
