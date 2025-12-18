import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Edit Metadata - pdf.makr.io';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#fefcf7',
          padding: 60,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 40,
            border: '4px solid #f59e0b',
            borderRadius: 20,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 120 }}>✏️</div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#1c1917',
              lineHeight: 1.2,
            }}
          >
            Edit Metadata
          </div>
          <div style={{ fontSize: 36, color: '#78716c', maxWidth: 800 }}>
            Update PDF metadata and properties
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 600, color: '#f59e0b' }}>
            pdf.makr.io
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              padding: '12px 40px',
              borderRadius: 25,
            }}
          >
            100% Private
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
