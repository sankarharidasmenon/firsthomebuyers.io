import React from 'react'

export function Footer() {
  return (
    <footer 
      className="w-full py-8 text-center mt-auto px-5" 
      style={{ background: '#111111' }}
    >
      <div className="max-w-[800px] mx-auto flex flex-col items-center gap-3">
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.4)' }}>
          © 2025 FirstNest · Not financial advice · Free to use
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', color: 'rgba(255, 255, 255, 0.25)', lineHeight: 1.6, maxWidth: 600 }}>
          Disclaimer: The calculations and information provided by FirstNest are estimates for educational purposes only and do not constitute professional financial or legal advice. Please consult with a qualified financial advisor or mortgage broker before making any property or financial decisions.
        </p>
      </div>
    </footer>
  )
}

