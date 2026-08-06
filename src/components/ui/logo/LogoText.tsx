import React from 'react'
import styles from './logo.module.css'

interface LogoTextProps {
  fontSize: string
  theme?: 'light' | 'dark'
}

export function LogoText({ fontSize, theme = 'light' }: LogoTextProps) {
  const isDark = theme === 'dark'
  const primaryText = isDark ? '#FFFFFF' : '#00205B'
  const highlightText = isDark ? '#C8102E' : '#E4002B'

  return (
    <div className={styles.textWrap} style={{ fontSize, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex' }}>
      <span 
        className={styles.textFirst} 
        style={{ fontWeight: 800, color: primaryText }}
      >
        First
      </span>
      <span 
        className={styles.textNest} 
        style={{ fontWeight: 700, color: highlightText, transition: 'color 0.25s ease' }}
      >
        Home
      </span>
      <span 
        className={styles.textBuyers} 
        style={{ fontWeight: 700, color: primaryText, transition: 'color 0.25s ease' }}
      >
        Buyers
      </span>
    </div>
  )
}
