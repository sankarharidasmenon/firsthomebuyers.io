import React from 'react'
import styles from './logo.module.css'

interface LogoTextProps {
  fontSize: string
}

export function LogoText({ fontSize }: LogoTextProps) {
  return (
    <div className={styles.textWrap} style={{ fontSize, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex' }}>
      <span 
        className={styles.textFirst} 
        style={{ fontWeight: 800, color: 'currentColor' }}
      >
        First
      </span>
      <span 
        className={styles.textNest} 
        style={{ fontWeight: 600, color: 'var(--color-logo-gold, #D8BC4A)', transition: 'color 0.25s ease' }}
      >
        HomeBuyers
      </span>
    </div>
  )
}
