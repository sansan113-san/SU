import React, { useEffect, useState } from 'react'
import KoheAvatar from '../components/KoheAvatar.jsx'

export default function Scene2_Move({ onComplete }) {
  const [textPhase, setTextPhase] = useState(0)
  const [showNext, setShowNext] = useState(false)

  // 나레이션 텍스트 순차 표시
  const narrationLines = [
    "그곳은 어둡지도 밝지도 않아요.",
    "그 안에 뭐가 있는지는 아직 모르고요.",
    "정말 얇은데 되게 무거워요.",
    "만지면 따뜻한데요 날카로워요.",
    "뭐든지 담을 수 있고요.",
    "심지어 눈에 보이지 않는 것까지.",
    "어쩌면 난생 처음 보는 것까지도.",
    "가벼운 노란색, 무언가 날라가고 있네요.",
    "여러 개의 통로가 있지요.",
    "나가고, 들어와요.",
    "그걸 바라보는 늙은 사람이 있네요.",
    "기다리고 있어요.",
    "쇠와 유리가 부딪히는 소리, 목소리들.",
    "이곳은 그런 곳이에요.",
  ]

  useEffect(() => {
    let idx = 0
    const interval = setInterval(() => {
      idx++
      setTextPhase(idx)
      if (idx >= narrationLines.length) {
        clearInterval(interval)
        setTimeout(() => setShowNext(true), 800)
      }
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="scene scene-enter" style={{ justifyContent: 'center' }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        opacity: 0.8
      }}/>

      {/* Subtle path line */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
        viewBox="0 0 375 812" preserveAspectRatio="none"
      >
        <path
          d="M 187 700 Q 120 550 187 400 Q 250 250 187 100"
          stroke="#C4A882" strokeWidth="1" fill="none"
          strokeDasharray="4 8"
        />
      </svg>

      <div className="ui-layer">
        {/* Header */}
        <div className="header-bar">
          <span className="header-logo">KOHE — 장소 수리반</span>
          <span className="header-badge">SCENE 02</span>
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          padding: '32px 24px',
          position: 'relative',
          zIndex: 10,
          overflowY: 'auto'
        }}>
          {/* Kohe Avatar */}
          <KoheAvatar size={96} label="코헤 요원" />

          {/* Narration Text — 최근 몇 줄만 표시해 화면 넘침 방지 */}
          <div style={{
            textAlign: 'center',
            maxWidth: '320px',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: '8px'
          }}>
            {narrationLines.map((line, i) => {
              if (i >= textPhase || i < textPhase - 4) return null
              const isCurrent = i === textPhase - 1
              return (
                <p
                  key={i}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: isCurrent ? '18px' : '14px',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-faint)',
                    lineHeight: 1.7,
                    transition: 'all 0.8s ease',
                    animation: isCurrent ? 'fadeIn 0.8s ease forwards' : 'none'
                  }}
                >
                  {line}
                </p>
              )
            })}
            {textPhase < narrationLines.length && (
              <div className="dots-loader" style={{ justifyContent: 'center', marginTop: '8px' }}>
                <span/><span/><span/>
              </div>
            )}
          </div>

          {/* Direction hint */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            코헤를 따라 현장으로 이동하세요
          </div>
        </div>

        {/* Proceed Button */}
        {showNext && (
          <div style={{ padding: '24px', paddingBottom: '48px' }}>
            <button
              className="btn btn-primary fade-text"
              style={{ width: '100%' }}
              onClick={onComplete}
            >
              현장 도착 →
            </button>
          </div>
        )}

        {/* Scene Indicator */}
        <div className="scene-indicator">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className={`scene-dot ${n === 1 ? 'done' : n === 2 ? 'active' : ''}`}/>
          ))}
        </div>
      </div>

      {/* Ambient Sound Indicator */}
      <div className="ambient-indicator">
        <div className="ambient-bar"/>
        <div className="ambient-bar"/>
        <div className="ambient-bar"/>
        <div className="ambient-bar"/>
      </div>
    </div>
  )
}
