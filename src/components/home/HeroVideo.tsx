'use client'

import React from 'react'

// REPLACE WITH CLIENT VIDEO ID
const VIDEO_ID = 'gihZWcjXtUU'

export function HeroVideo() {
  return (
    <div
      style={{
        maxWidth: 760,
        width: '100%',
        aspectRatio: '21 / 9',
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        transform: 'translateZ(0)', /* Hardware acceleration to prevent flickering */
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <iframe
          title="FirstNest intro video"
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&playlist=${VIDEO_ID}&playsinline=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: '135%', /* Crops the 16:9 video to fit the 21:9 container without black bars */
            transform: 'translateY(-50%) translateZ(0)', /* Center vertically and fix flicker */
            pointerEvents: 'none',
            border: 'none',
            backfaceVisibility: 'hidden',
          }}
          loading="lazy"
        />

        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
          }}
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
          <p
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
          </p>
        </div>
      </div>
    </div>
  )
}
