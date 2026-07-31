import React from 'react'
import styles from './logo.module.css'

interface LogoIconProps {
  height: number
}

export function LogoIcon({ height }: LogoIconProps) {
  return (
    <div className={styles.iconWrapper} style={{ height, width: height * 1.65, position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg 
        viewBox="0 4 44 24" 
        width="100%" 
        height="100%" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Flowing Golden Landscape Curve - 1 smooth Bézier curve, 20% thinner, warm brushed gold */}
        <path 
          className={styles.baseLine}
          d="M 2 24.5 C 10 22.5, 20 27.5, 43 21" 
          stroke="var(--color-logo-gold, #D8BC4A)" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          fill="none"
          style={{ transition: 'stroke 0.25s ease' }}
        />

        {/* Plant Stem & Leaves (Gold) - Complementary accent (40% visual weight) */}
        <g 
          className={styles.plant} 
          fill="var(--color-logo-gold, #D8BC4A)"
          style={{ transition: 'fill 0.25s ease' }}
        >
          {/* Stem - Thinner than house stroke (1.4px) growing naturally from curve */}
          <path 
            d="M 30 25.2 Q 31.8 19, 34 14" 
            stroke="var(--color-logo-gold, #D8BC4A)" 
            strokeWidth="1.4" 
            strokeLinecap="round" 
            fill="none" 
            style={{ transition: 'stroke 0.25s ease' }}
          />
          
          {/* Top Leaf - Organic Bézier curve, 10% smaller */}
          <path d="M 34 14 C 33 8, 37 7, 39 9 C 37.5 11.5, 35.8 13.2, 34 14 Z" />
          
          {/* Right Leaf */}
          <path d="M 32.5 18 C 37 16, 39 17.5, 40 19.5 C 37.5 21, 34.5 19.5, 32.5 18 Z" />
          
          {/* Left Leaf */}
          <path d="M 31 21.5 C 28 18, 28.2 14.5, 30 13 C 32 15, 32.2 19, 31 21.5 Z" />
        </g>
        
        {/* House Outline (Black) - Primary element (60% visual weight), refined 2.2px stroke */}
        <g className={styles.house} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Symmetrical roof: lighter, elegant pitch, 5-8% widened */}
          <path d="M 5 15 L 16 6 L 27 15" />
          {/* Left Wall sitting naturally on landscape curve */}
          <path d="M 8 12.55 V 23.5" />
          {/* Right Wall sitting naturally on landscape curve */}
          <path d="M 24 12.55 V 25.2" />
        </g>

        {/* 4 Window Squares (Gold) - 8% larger, perfectly centered, rounded corners */}
        <g 
          className={styles.house} 
          fill="var(--color-logo-gold, #D8BC4A)"
          style={{ transition: 'fill 0.25s ease' }}
        >
          <rect x="12.2" y="13.7" width="3.2" height="3.2" rx="0.7" />
          <rect x="16.6" y="13.7" width="3.2" height="3.2" rx="0.7" />
          <rect x="12.2" y="18.1" width="3.2" height="3.2" rx="0.7" />
          <rect x="16.6" y="18.1" width="3.2" height="3.2" rx="0.7" />
        </g>
      </svg>
    </div>
  )
}
