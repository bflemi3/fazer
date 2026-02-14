'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            padding: '0 1rem',
          }}
        >
          <div style={{ width: '100%', maxWidth: '24rem', textAlign: 'center' }}>
            <img
              src="/icons/icon-192x192.png"
              alt="Fazer"
              width={64}
              height={64}
              style={{ margin: '0 auto', borderRadius: '1rem' }}
            />
            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                color: '#fafafa',
                marginTop: '1rem',
                marginBottom: 0,
              }}
            >
              Fazer
            </h1>
            <p
              style={{
                marginTop: '1rem',
                fontSize: '1rem',
                color: '#a1a1aa',
              }}
            >
              Something didn't load right. Give it another shot, or refresh the page if it keeps happening.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#fafafa',
                backgroundColor: 'transparent',
                border: '1px solid #3f3f46',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
