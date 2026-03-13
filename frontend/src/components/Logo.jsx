function Logo({ size = 'md' }) {
  const scale = size === 'sm' ? 0.55 : size === 'lg' ? 1.2 : 0.8;
  const w = Math.round(520 * scale);
  const h = Math.round(100 * scale);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 100" width={w} height={h}>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#4a7fd4', stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="lensGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" style={{ stopColor: '#7ab3f0', stopOpacity: 1 }} />
          <stop offset="60%" style={{ stopColor: '#1c3a6e', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0a1a3a', stopOpacity: 1 }} />
        </radialGradient>
        <radialGradient id="lensShine" cx="30%" cy="30%" r="50%">
          <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* Camera body */}
      <rect x="40" y="28" width="64" height="48" fill="#1c2a4a" rx="8" />
      <rect x="58" y="18" width="28" height="14" fill="#1c2a4a" rx="5" />
      <rect x="62" y="21" width="10" height="5" fill="#4a7fd4" rx="2" />

      {/* Lens */}
      <circle cx="72" cy="52" r="18" fill="#0f1e38" />
      <circle cx="72" cy="52" r="14" fill="#162444" />
      <circle cx="72" cy="52" r="10" fill="url(#lensGrad)" />
      <circle cx="72" cy="52" r="10" fill="url(#lensShine)" />
      <circle cx="68" cy="48" r="2.5" fill="white" opacity="0.5" />

      {/* Blinking dot */}
      <circle cx="96" cy="34" r="4" fill="#4a7fd4">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Shutter */}
      <circle cx="88" cy="24" r="5" fill="#243656" />
      <circle cx="88" cy="24" r="3" fill="#4a7fd4" />

      {/* Text */}
      <text
        x="310" y="72"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
        fontWeight="900"
        fontSize="58"
        fontStyle="italic"
        letterSpacing="3"
        fill="white"
      >
        FLICK<tspan fill="#4a7fd4">PICK</tspan>
      </text>

      {/* Underline */}
      <rect x="130" y="82" width="360" height="3" rx="2" fill="url(#grad)" />
    </svg>
  );
}

export default Logo;
