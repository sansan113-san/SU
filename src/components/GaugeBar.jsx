import React from 'react'

// 게이지 바 컴포넌트
export default function GaugeBar({ value = 0, label = '', isError = false }) {
  return (
    <div className="gauge-container">
      {label && (
        <div className="gauge-label">{label}</div>
      )}
      <div className="gauge-track">
        <div
          className={`gauge-fill${isError ? ' error' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
