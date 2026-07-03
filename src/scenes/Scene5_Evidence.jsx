import React, { useState, useEffect } from 'react'

export default function Scene5_Evidence({ onComplete }) {
  const [completed, setCompleted] = useState(false)
  const [showInstruction, setShowInstruction] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowInstruction(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleDone = () => {
    setCompleted(true)
    setTimeout(() => onComplete(), 800)
  }

  return (
    <div
      className="scene"
      style={{
        background: 'var(--bg-primary)',
        border: completed ? 'none' : '0px solid transparent',
      }}
    >
      {/* 점멸 테두리 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5,
        boxShadow: 'inset 0 0 0 2px var(--accent)',
        animation: completed ? 'none' : 'borderBlink 1.5s ease-in-out infinite',
        borderRadius: '0px',
      }}/>

      <div className="ui-layer">
        <div className="header-bar">
          <span className="header-logo">KOHE — 장소 수리반</span>
          <span className="header-badge">SCENE 05</span>
        </div>

        <div className="content-area" style={{ justifyContent: 'center', gap: '40px' }}>
          {/* 완료 봉인 아이콘 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 16px',
              animation: 'sealIn 0.6s var(--ease-spring) forwards'
            }}>
              🔒
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              letterSpacing: '0.2em', color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              접착 완료
            </p>
          </div>

          {showInstruction && (
            <div className="fade-text" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 미션 지시 */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  letterSpacing: '0.15em', color: 'var(--text-muted)',
                  textTransform: 'uppercase', marginBottom: '12px'
                }}>
                  실물 액션 지시
                </p>
                <p style={{
                  fontFamily: 'var(--font-serif)', fontSize: '18px',
                  fontStyle: 'italic', fontWeight: 300,
                  color: 'var(--text-primary)', lineHeight: 1.9
                }}>
                  이제 주머니에서<br/>
                  지퍼백 속 클레이를<br/>
                  은밀히 꺼내십시오.
                </p>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-serif)', fontSize: '17px',
                  fontStyle: 'italic', fontWeight: 300,
                  color: 'var(--text-secondary)', lineHeight: 1.9
                }}>
                  주변의 시선을 살피며,<br/>
                  방금 촬영했던 실제 틈새에<br/>
                  클레이를 <strong>꾹꾹 눌러 넣어주세요.</strong>
                </p>
              </div>

              {/* 완료 버튼 */}
              <button
                className={`btn btn-primary${completed ? '' : ' border-blink'}`}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '16px',
                  background: completed ? 'var(--accent-deep)' : 'var(--text-primary)'
                }}
                onClick={handleDone}
                disabled={completed}
              >
                {completed ? '✓ 수리 완료' : '클레이를 넣었습니다 [완료]'}
              </button>
            </div>
          )}
        </div>

        <div className="scene-indicator">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className={`scene-dot ${n <= 4 ? 'done' : n === 5 ? 'active' : ''}`}/>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sealIn {
          from { transform: scale(0) rotate(-180deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
