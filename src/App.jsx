import React, { useState, useEffect, useRef } from 'react'
import Scene1_Papri from './scenes/Scene1_Papri.jsx'
import Scene2_Move from './scenes/Scene2_Move.jsx'
import Scene3_Arrive from './scenes/Scene3_Arrive.jsx'
import Scene4_Photo from './scenes/Scene4_Photo.jsx'
import Scene5_Evidence from './scenes/Scene5_Evidence.jsx'
import Scene6_Return from './scenes/Scene6_Return.jsx'
import GuidePage from './pages/GuidePage.jsx'

export default function App() {
  const [scene, setScene] = useState(1)
  const [showGuide, setShowGuide] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)

  // 나레이션 재생용 단일 Audio 엘리먼트 (iOS 자동재생 정책 대응)
  const narrationElRef = useRef(null)
  // 가이드 화면일 땐 이 기기를 플레이어로 취급하지 않음 (자기 방송 되돌이 방지)
  const showGuideRef = useRef(false)
  useEffect(() => { showGuideRef.current = showGuide }, [showGuide])

  // 씬 공유 데이터
  const [selectedClay, setSelectedClay] = useState(null)
  const [photoDataUrl, setPhotoDataUrl] = useState(null)

  // URL 해시로 가이드 진입
  useEffect(() => {
    const checkGuide = () => {
      if (window.location.hash === '#guide') setShowGuide(true)
    }
    checkGuide()
    window.addEventListener('hashchange', checkGuide)
    return () => window.removeEventListener('hashchange', checkGuide)
  }, [])

  // 가이드 오디오 명령 수신 → 플레이어 재생 (기기 간: ntfy.sh 릴레이)
  useEffect(() => {
    let cleanup = null
    import('./utils/broadcast.js').then(({ listenForPlayCommands }) => {
      cleanup = listenForPlayCommands((data) => {
        if (showGuideRef.current) return // 가이드 기기에서는 재생하지 않음
        const el = narrationElRef.current
        if (!el) return
        if (data.type === 'PLAY_AUDIO' && data.trackId) {
          el.src = `audio/${data.trackId}.wav`
          el.currentTime = 0
          el.play().catch(() => {})
        } else if (data.type === 'STOP_AUDIO') {
          el.pause()
          el.currentTime = 0
        }
      })
    })
    return () => { if (cleanup) cleanup() }
  }, [])

  // 첫 인터랙션 시 나레이션 Audio 언락(iOS)만 수행
  // 자동 앰비언트는 재생하지 않음 — 소리는 가이드가 송출할 때만 남
  const handleFirstInteraction = () => {
    if (audioStarted) return
    setAudioStarted(true)
    // iOS: 사용자 제스처 안에서 한 번 재생해두면 이후 프로그램 재생 허용
    if (!narrationElRef.current) {
      const el = new Audio()
      el.volume = 0.9
      el.playsInline = true
      narrationElRef.current = el
    }
    const el = narrationElRef.current
    // 무음 언락: 재생 시도 후 즉시 정지 (가이드 송출 전까지 소리 안 남)
    el.play().then(() => el.pause()).catch(() => {})
  }

  // 씬 전환
  const goToScene = (nextScene) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setScene(nextScene)
      setIsTransitioning(false)
    }, 400)
  }

  const handleScene1Complete = ({ selectedClay: clay }) => {
    setSelectedClay(clay)
    goToScene(2)
  }

  const handleScene3Complete = ({ photoDataUrl: photo }) => {
    setPhotoDataUrl(photo)
    goToScene(4)
  }

  if (showGuide) {
    return (
      <GuidePage onExit={() => {
        setShowGuide(false)
        window.history.pushState('', document.title, window.location.pathname)
      }}/>
    )
  }

  return (
    <div onClick={handleFirstInteraction} style={{ width: '100%', height: '100dvh' }}>
      {/* 가이드 진입 링크 (숨김) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          window.location.hash = 'guide'
          setShowGuide(true)
        }}
        style={{
          position: 'fixed', bottom: '12px', left: '12px',
          zIndex: 999, background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '8px',
          opacity: 0.0, // 완전 숨김 — 가이드만 알고 있는 위치
          fontSize: '10px',
          color: 'var(--text-faint)'
        }}
        aria-label="가이드 페이지"
        id="guide-entry"
      >
        ◉
      </button>

      {/* 씬 렌더링 */}
      <div style={{ opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.4s ease' }}>
        {scene === 1 && <Scene1_Papri onComplete={handleScene1Complete} />}
        {scene === 2 && <Scene2_Move onComplete={() => goToScene(3)} />}
        {scene === 3 && <Scene3_Arrive onComplete={handleScene3Complete} />}
        {scene === 4 && (
          <Scene4_Photo
            photoDataUrl={photoDataUrl}
            selectedClay={selectedClay}
            onComplete={() => goToScene(5)}
          />
        )}
        {scene === 5 && <Scene5_Evidence onComplete={() => goToScene(6)} />}
        {scene === 6 && <Scene6_Return onComplete={() => {}} />}
      </div>
    </div>
  )
}
