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

  // BroadcastChannel으로 가이드 오디오 수신 → 플레이어 재생
  useEffect(() => {
    let cleanup = null
    import('./utils/broadcast.js').then(({ listenForPlayCommands }) => {
      cleanup = listenForPlayCommands((data) => {
        if (data.type === 'PLAY_AUDIO' && data.trackId) {
          const audio = new Audio(`/audio/${data.trackId}.wav`)
          audio.volume = 0.9
          audio.play().catch(() => {})
        }
      })
    })
    return () => { if (cleanup) cleanup() }
  }, [])

  // 첫 인터랙션 시 앰비언트 시작
  const handleFirstInteraction = () => {
    if (audioStarted) return
    setAudioStarted(true)
    import('./utils/audioEngine.js').then(({ startAmbient }) => startAmbient())
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
