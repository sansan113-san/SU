import React from 'react'

// 코헤 요원 아바타 — 이모지 기반 SVG 애니메이션
export default function KoheAvatar({ size = 80, label = '코헤 요원' }) {
  return (
    <div className="kohe-avatar-wrapper">
      <div className="kohe-avatar" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Body */}
          <g className="kohe-body">
            {/* Head */}
            <circle cx="40" cy="24" r="14" fill="#EAE6DE" stroke="#C4A882" strokeWidth="1.5"/>
            {/* Face */}
            <circle cx="35" cy="22" r="2" fill="#5A5650"/>
            <circle cx="45" cy="22" r="2" fill="#5A5650"/>
            {/* Smile */}
            <path d="M35 28 Q40 33 45 28" stroke="#5A5650" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

            {/* Body */}
            <rect x="27" y="40" width="26" height="22" rx="6" fill="#F2EFE9" stroke="#E5E0D8" strokeWidth="1"/>

            {/* Uniform badge */}
            <rect x="32" y="44" width="16" height="8" rx="2" fill="#C4A882" opacity="0.5"/>
            <text x="40" y="51" textAnchor="middle" fontFamily="monospace" fontSize="5" fill="#8A857C">KOHE</text>

            {/* Legs */}
            <rect x="30" y="62" width="8" height="12" rx="3" fill="#EAE6DE" stroke="#E5E0D8" strokeWidth="1"/>
            <rect x="42" y="62" width="8" height="12" rx="3" fill="#EAE6DE" stroke="#E5E0D8" strokeWidth="1"/>

            {/* Left arm (static) */}
            <rect x="17" y="41" width="10" height="6" rx="3" fill="#EAE6DE" stroke="#E5E0D8" strokeWidth="1"/>
          </g>

          {/* Right arm (waving) */}
          <g className="kohe-arm-right">
            <rect x="53" y="39" width="10" height="6" rx="3" fill="#EAE6DE" stroke="#E5E0D8" strokeWidth="1"
              transform="rotate(-20 53 42)"
            />
            {/* Hand */}
            <circle cx="65" cy="37" r="4" fill="#EAE6DE" stroke="#E5E0D8" strokeWidth="1"/>
          </g>
        </svg>
      </div>
      {label && (
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }}>
          [ {label} ]
        </span>
      )}
    </div>
  )
}
