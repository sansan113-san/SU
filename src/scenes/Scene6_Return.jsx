import React, { useState, useEffect } from 'react'

const TEXT_BLOCKS = [
  {
    delay: 0,
    content: (
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '18px',
        fontStyle: 'italic', fontWeight: 300,
        color: 'var(--text-secondary)', lineHeight: 2,
        textAlign: 'center'
      }}>
        우리가 무심히 지나는 장소들은<br/>
        수많은 기억들이 차곡차곡 쌓여<br/>
        만들어집니다.
      </p>
    )
  },
  {
    delay: 2800,
    content: (
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '17px',
        fontStyle: 'italic', fontWeight: 300,
        color: 'var(--text-secondary)', lineHeight: 2,
        textAlign: 'center'
      }}>
        담벼락에 기대어 친구를 기다리던 순간,<br/>
        길가 구석에서 죽은 새를 마주했던 날,<br/>
        된장찌개 냄새가 새어나오는<br/>
        이웃집 창문의 틈.
      </p>
    )
  },
  {
    delay: 6000,
    content: (
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '17px',
        fontStyle: 'italic', fontWeight: 300,
        color: 'var(--text-secondary)', lineHeight: 2,
        textAlign: 'center'
      }}>
        기억은 오래 머물지 않습니다.<br/>
        우리가 살아가며 많은 기억을<br/>
        무의식의 저편으로 보내는 순간마다,<br/>
        장소에는 조금씩 균열이 생기곤 합니다.
      </p>
    )
  },
  {
    delay: 9500,
    content: (
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '17px',
        fontStyle: 'italic', fontWeight: 300,
        color: 'var(--text-secondary)', lineHeight: 2,
        textAlign: 'center'
      }}>
        그 틈새에서 떨어져 나온<br/>
        외로운 조각들이 바로
      </p>
    )
  },
  {
    delay: 11500,
    isCor: true
  },
  {
    delay: 14000,
    content: (
      <p style={{
        fontFamily: 'var(--font-serif)', fontSize: '18px',
        fontStyle: 'italic',
        color: 'var(--text-primary)', lineHeight: 2,
        textAlign: 'center'
      }}>
        당신은 오늘 장소에<br/>
        <strong>심장을 돌려주고</strong> 왔습니다.
      </p>
    )
  },
  {
    delay: 17000,
    isFinal: true
  }
]

export default function Scene6_Return({ onComplete }) {
  const [visibleBlocks, setVisibleBlocks] = useState(0)
  const [showEnd, setShowEnd] = useState(false)

  useEffect(() => {
    import('../utils/audioEngine.js').then(({ transitionToWarmAmbient }) => transitionToWarmAmbient())
  }, [])

  useEffect(() => {
    const timers = TEXT_BLOCKS.map((block, i) => {
      return setTimeout(() => {
        setVisibleBlocks(i + 1)
        if (block.isFinal) {
          setTimeout(() => setShowEnd(true), 2000)
        }
      }, block.delay)
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="scene scene-enter" style={{ overflowY: 'auto' }}>
      {/* 따뜻한 그래디언트 배경 */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, #F5EFE6 50%, var(--bg-secondary) 100%)'
      }}/>

      <div className="ui-layer" style={{ overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div className="header-bar">
          <span className="header-logo">KOHE — 장소 수리반</span>
          <span className="header-badge">SCENE 06</span>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: '48px', padding: '48px 32px 80px',
          alignItems: 'center', minHeight: '100%'
        }}>
          {TEXT_BLOCKS.slice(0, visibleBlocks).map((block, i) => {
            if (block.isCor) {
              return (
                <div key={i} className="cor-reveal fade-text">
                  <div className="cor-latin">Cor</div>
                  <div className="cor-meaning">라틴어 / 심장, 핵심, 기억의 중심</div>
                  <div className="cor-tagline">
                    Cor는 장소에서 떨어져 나온<br/>기억의 심장입니다.
                  </div>
                </div>
              )
            }
            if (block.isFinal) {
              return (
                <div key={i} className="fade-text" style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '1px', height: '60px',
                    background: 'linear-gradient(to bottom, transparent, var(--border))',
                    margin: '0 auto 32px'
                  }}/>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    letterSpacing: '0.25em', color: 'var(--text-muted)',
                    textTransform: 'uppercase', marginBottom: '16px'
                  }}>
                    다음 임무
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-serif)', fontSize: '18px',
                    fontStyle: 'italic', fontWeight: 300,
                    color: 'var(--text-secondary)', lineHeight: 1.9
                  }}>
                    이제는 당신 차례입니다.<br/>
                    이 물건이 머물고 싶은 장소를<br/>
                    찾아 주세요.<br/>
                    언젠가 그곳도 하나의 기억이<br/>
                    될 것입니다.
                  </p>
                  <div style={{
                    marginTop: '24px',
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    letterSpacing: '0.15em', color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    오늘의 임무는 여기서 마칩니다.<br/>잘 부탁드립니다.
                  </div>
                </div>
              )
            }
            return (
              <div key={i} className="fade-text">
                {block.content}
              </div>
            )
          })}

          {/* 최종 종료 버튼 */}
          {showEnd && (
            <div className="fade-text" style={{ width: '100%', maxWidth: '320px' }}>
              <div style={{
                width: '1px', height: '40px',
                background: 'linear-gradient(to bottom, var(--border), transparent)',
                margin: '0 auto 32px'
              }}/>
              <p style={{
                fontFamily: 'var(--font-serif)', fontSize: '40px',
                fontStyle: 'italic', textAlign: 'center',
                color: 'var(--text-primary)', marginBottom: '24px',
                letterSpacing: '0.05em'
              }}>
                감사합니다
              </p>
              <button
                className="btn btn-outline"
                style={{ width: '100%' }}
                onClick={() => window.location.reload()}
              >
                처음으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ambient-indicator">
        <div className="ambient-bar" style={{ background: 'var(--accent-warm)' }}/>
        <div className="ambient-bar" style={{ background: 'var(--accent-warm)' }}/>
        <div className="ambient-bar" style={{ background: 'var(--accent-warm)' }}/>
        <div className="ambient-bar" style={{ background: 'var(--accent-warm)' }}/>
      </div>
    </div>
  )
}
