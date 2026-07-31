import React from 'react'
import styles from './logo.module.css'

interface LogoBadgeProps {
  fontSize?: string
  className?: string
}

export function LogoBadge({ fontSize, className }: LogoBadgeProps) {
  return (
    <div className={styles.betaBadge}>
      BETA
    </div>
  )
}
