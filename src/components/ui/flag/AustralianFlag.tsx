import styles from './AustralianFlag.module.css'

/**
 * Small decorative branding accent placed beside the logo. Purely
 * ornamental — aria-hidden so it doesn't add screen-reader noise, and the
 * animation respects prefers-reduced-motion (see AustralianFlag.module.css).
 *
 * Markup/colors are copied verbatim from /public/flags/au.svg (official
 * flag colors, untouched) and inlined rather than loaded via <img> — avoids
 * an extra network request for a ~1KB decorative icon and the Next.js
 * no-img-element lint rule. Renders identically in light and dark theme
 * since none of these colors reference theme tokens.
 */
export function AustralianFlag() {
  return (
    <span className={styles.flagWrap} aria-hidden="true">
      <svg
        width="30"
        height="15"
        viewBox="0 0 10080 5040"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <clipPath id="fn-au-flag-c1">
            <path d="M0,0H6V3H0z" />
          </clipPath>
          <clipPath id="fn-au-flag-c2">
            <path d="M0,0V1.5H6V3H6zM6,0H3V3H0V3z" />
          </clipPath>
          <path
            id="fn-au-flag-star7"
            d="M0,-360 69.421398,-144.155019 281.459334,-224.456329 155.988466,-35.603349 350.974048,80.107536 125.093037,99.758368 156.198146,324.348792 0,160 -156.198146,324.348792 -125.093037,99.758368 -350.974048,80.107536 -155.988466,-35.603349 -281.459334,-224.456329 -69.421398,-144.155019z"
          />
          <path
            id="fn-au-flag-star5"
            d="M0,-210 54.859957,-75.508253 199.721868,-64.893569 88.765275,28.841586 123.434903,169.893569 0,93.333333 -123.434903,169.893569 -88.765275,28.841586 -199.721868,-64.893569 -54.859957,-75.508253z"
          />
        </defs>
        <g transform="scale(840)">
          <rect width="12" height="6" fill="#012169" />
          <path d="M0,0 6,3M6,0 0,3" stroke="#fff" strokeWidth="0.6" clipPath="url(#fn-au-flag-c1)" />
          <path d="M0,0 6,3M6,0 0,3" stroke="#e4002b" strokeWidth="0.4" clipPath="url(#fn-au-flag-c2)" />
          <path d="M3,0V3M0,1.5H6" stroke="#fff" />
          <path d="M3,0V3M0,1.5H6" stroke="#e4002b" strokeWidth="0.6" />
        </g>
        <g fill="#fff">
          <use xlinkHref="#fn-au-flag-star7" transform="translate(2520, 3780) scale(2.1)" />
          <use xlinkHref="#fn-au-flag-star7" x="7560" y="4200" />
          <use xlinkHref="#fn-au-flag-star7" x="6300" y="2205" />
          <use xlinkHref="#fn-au-flag-star7" x="7560" y="840" />
          <use xlinkHref="#fn-au-flag-star7" x="8680" y="1869" />
          <use xlinkHref="#fn-au-flag-star5" x="8064" y="2730" />
        </g>
      </svg>
    </span>
  )
}
