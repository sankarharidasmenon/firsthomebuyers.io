import React from 'react'
import styles from './logo.module.css'

interface LogoTextProps {
  fontSize: string
  theme?: 'light' | 'dark'
}

export function LogoText({ fontSize, theme = 'light' }: LogoTextProps) {
  const isDark = theme === 'dark'
  const auBlue = isDark ? '#FFFFFF' : '#012169'
  const auRed = isDark ? '#C8102E' : '#E4002B'

  return (
    <div className={styles.textWrap} style={{ fontSize, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex' }}>
      <span
        className={styles.textFirst}
        style={{ fontWeight: 800, color: auRed, transition: 'color 0.25s ease' }}
      >
        First
      </span>
      <span
        className={styles.textNest}
        style={{ fontWeight: 700, color: auBlue, transition: 'color 0.25s ease' }}
      >
        Home
      </span>
      <span
        className={styles.textBuyers}
        style={{ fontWeight: 700, color: auBlue, transition: 'color 0.25s ease' }}
      >
        Buyers
      </span>
    </div>
  )
}
