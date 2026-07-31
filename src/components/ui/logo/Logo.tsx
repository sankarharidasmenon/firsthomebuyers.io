import React from 'react'
import clsx from 'clsx'
import styles from './logo.module.css'
import { LogoIcon } from './LogoIcon'
import { LogoText } from './LogoText'
import { LogoBadge } from './LogoBadge'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showBadge?: boolean
  className?: string
  variant?: 'icon' | 'full'
}

const sizes = {
  sm: { height: 24, text: '1.25rem' },
  md: { height: 32, text: '1.5rem' },
  lg: { height: 40, text: '1.875rem' },
  xl: { height: 48, text: '2.25rem' }
}

export function Logo({
  size = 'md',
  animated = false,
  showBadge = false,
  className,
  variant = 'full'
}: LogoProps) {
  const { height, text } = sizes[size]
  
  return (
    <div 
      className={clsx(
        styles.logoContainer, 
        animated && styles.logoAnimated,
        className
      )}
      aria-label="FirstNest"
      role="img"
    >
      <LogoIcon height={height} />

      {variant === 'full' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <LogoText fontSize={text} />
          {showBadge && <LogoBadge fontSize={text} />}
        </div>
      )}
    </div>
  )
}
