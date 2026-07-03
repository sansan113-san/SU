import React, { useState, useRef, useEffect } from 'react'

export default function Scene3_Arrive({ onComplete }) {
  const [phase, setPhase] = useState('arrive') // arrive | observe | camera
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraError, setCameraError] = useState(null)

  // 도착 진동 & 자동 다음 단계
  useEffect(() => {
    import('../utils/audioEngine.js').then(({ vibrateDevice }) => vibrateDevice([200, 100, 200]))
    const timer = setTimeout(() => setPhase('observe'), 2000)
    return () => clearTimeout(timer)
  }, [])

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase('camera')
    } catch (err) {
      setCameraError('카메라 접근 권한이 필요합니다.')
      console.error('Camera error:', err)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    // 스트림 정지
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    onComplete({ photoDataUrl: dataUrl })
  }

  return (
    <div className="scene" style={{ background: 'var(--bg-primary)' }}>
      {/* 카메라 뷰 */}
      {phase === 'camera' && (
        <div className="camera-view">
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>

          {/* 카메라 가이드 오버레이 */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Corner brackets */}
            {['topLeft','topRight','bottomLeft','bottomRight'].map(pos => (
              <div key={pos} style={{
                position: 'absolute',
                width: 40, height: 40,
                ...(pos.includes('top') ? { top: 60 } : { bottom: 120 }),
                ...(pos.includes('Left') ? { left: 40 } : { right: 40 }),
                borderTop: pos.includes('top') ? '2px solid rgba(196,168,130,0.8)' : 'none',
                borderBottom: pos.includes('bottom') ? '2px solid rgba(196,168,130,0.8)' : 'none',
                borderLeft: pos.includes('Left') ? '2px solid rgba(196,168,130,0.8)' : 'none',
                borderRight: pos.includes('Right') ? '2px solid rgba(196,168,130,0.8)' : 'none',
              }}/>
            ))}
          </div>

          {/* 가이드 텍스트 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '48px 24px 20px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)'
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase', textAlign: 'center'
            }}>
              균열을 찾아 촬영하세요
            </p>
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '20px 24px 48px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
          }}>
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: '16px',
              fontStyle: 'italic', color: 'rgba(255,255,255,0.7)'
            }}>
              마음이 가닿는 가장 깊은 균열 앞에 서십시오
            </p>
            <div className="camera-controls" style={{ position: 'relative', bottom: 'unset' }}>
              <button className="shutter-btn" onClick={capturePhoto}/>
            </div>
          </div>
        </div>
      )}

      {/* 도착 & 관찰 화면 */}
      {phase !== 'camera' && (
        <div className="ui-layer">
          <div className="header-bar">
            <span className="header-logo">KOHE — 장소 수리반</span>
            <span className="header-badge">SCENE 03</span>
          </div>

          <div className="content-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* 도착 */}
            {phase === 'arrive' && (
              <div style={{ textAlign: 'center' }}>
                <div className="arrival-text">도착</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  letterSpacing: '0.25em', color: 'var(--text-muted)',
                  marginTop: '16px', textTransform: 'uppercase'
                }}>
                  현장 작전 개시
                </div>
              </div>
            )}

            {/* 관찰 */}
            {phase === 'observe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    letterSpacing: '0.2em', color: 'var(--text-muted)',
                    textTransform: 'uppercase', marginBottom: '12px'
                  }}>
                    미세 관찰
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-serif)', fontSize: '19px',
                    fontStyle: 'italic', fontWeight: 300,
                    color: 'var(--text-primary)', lineHeight: 1.8
                  }}>
                    이제 벽을 등지고 잠시 눈을 감아보세요.<br/>
                    손을 들어 지나가는 바람을 만져보세요.<br/>
                    숨을 들이쉬어 이곳의 공기를 맡아보세요.
                  </p>
                </div>

                <div className="divider-dot">15초 정적</div>

                <p style={{
                  fontFamily: 'var(--font-serif)', fontSize: '17px',
                  fontStyle: 'italic', fontWeight: 300,
                  color: 'var(--text-secondary)', lineHeight: 1.8,
                  textAlign: 'center'
                }}>
                  이제 눈을 뜨세요.<br/>
                  벽에 코가 닿을 만큼 아주 가까이 다가가<br/>
                  손으로 쓰다듬어 봅니다.<br/>
                  <br/>
                  이곳의 <strong>빈틈</strong>을 찾아보세요.
                </p>

                {/* 카메라 아이콘 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={openCamera}
                    style={{
                      width: '64px', height: '64px',
                      borderRadius: '50%',
                      background: 'var(--text-primary)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px',
                      transition: 'transform 0.2s ease',
                      boxShadow: '0 8px 24px rgba(26,24,20,0.2)'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    📷
                  </button>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    letterSpacing: '0.15em', color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    균열을 촬영하세요
                  </p>
                  {cameraError && (
                    <p style={{ color: 'var(--alert)', fontSize: '12px', textAlign: 'center' }}>
                      {cameraError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="scene-indicator">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className={`scene-dot ${n <= 2 ? 'done' : n === 3 ? 'active' : ''}`}/>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
