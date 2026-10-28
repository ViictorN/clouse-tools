'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { detectClientLocale } from '@/lib/i18n';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const locale = detectClientLocale();
    router.replace(`/${locale}`);
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #0b0b0e)',
        color: 'var(--text-sub, #86868b)',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--primary, #6366f1)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ fontSize: '0.88rem', letterSpacing: '0.02em' }}>
          Loading Clouse Tools...
        </p>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
