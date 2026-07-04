'use client'

/**
 * Portrait-fill technique for the Shorts embed:
 *
 * YouTube always renders a 16:9 player regardless of video orientation.
 * A 9:16 Short inside that player appears pillarboxed — the actual video
 * content occupies only 31.6 % of the player width, with black bars on
 * each side.  (maths: (9/16)² = 81/256 ≈ 0.316)
 *
 * On desktop we eliminate the bars by expanding the iframe to 316 % of
 * the container width and centering it.  The container's overflow:hidden
 * clips the bars; the visible window shows exactly the portrait content.
 * No stretching — only cropping of the black bar area.
 *
 * Mobile keeps the standard 16:9 container so the layout is unchanged.
 */

const VIDEO_ID = '2mihxZObX4s'

export function HeroVideo() {
  return (
    <div className="fn-video-container">
      <style>{`
        /* ── Base (mobile) ── */
        .fn-video-container {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          transform: translateZ(0);
        }
        .fn-shorts-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          border: none;
          backface-visibility: hidden;
        }

        /* ── Desktop: portrait-fill / Shorts-reel treatment ── */
        @media (min-width: 1024px) {
          .fn-video-container {
            /* Remove fixed aspect ratio — height comes from the grid column */
            aspect-ratio: unset;
            height: 100%;
          }
          .fn-shorts-iframe {
            /* Expand to 316 % of container width so the portrait video
               content (31.6 % of the 16:9 player) fills exactly 100 % of
               the container width.  Centering hides the bars on both sides. */
            width: 316%;
            height: auto;
            aspect-ratio: 16 / 9;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateZ(0);
          }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <iframe
          className="fn-shorts-iframe"
          title="FirstNest intro video"
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&playlist=${VIDEO_ID}&playsinline=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          loading="lazy"
        />

        {/* Overlay */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
          aria-hidden="true"
        />

        {/* Overlay text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
            textAlign: 'center',
          }}
        >
          {/* <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: 'white',
              maxWidth: 320,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            Watch: How FirstNest works for Aussie first home buyers
          </p> */}
        </div>
      </div>
    </div>
  )
}
