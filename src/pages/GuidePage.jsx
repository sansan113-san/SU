import React, { useState, useRef, useEffect } from 'react'
import { sendPlayAudio, sendStopAudio } from '../utils/broadcast.js'

const TRACKS = [
  {
    id: '1',
    scene: 'SCENE 01 — 파프리',
    title: '나레이션 01 — 코헤 소개 & Cor 선택',
    path: 'audio/1.wav',
    desc: '"안녕하세요. 장소 수리반 [코헤]입니다…"'
  },
  {
    id: '2',
    scene: 'SCENE 02 — 이동',
    title: '나레이션 02 — 현장 묘사 1',
    path: 'audio/2.wav',
    desc: '"그곳은 어둡지도 밝지도 않아요…"'
  },
  {
    id: '3',
    scene: 'SCENE 02 — 이동',
    title: '나레이션 03 — 현장 묘사 2',
    path: 'audio/3.wav',
    desc: '"기다리고 있어요. 쇠와 유리가 부딪히는 소리…"'
  },
  {
    id: '4',
    scene: 'SCENE 03 — 도착',
    title: '나레이션 04 — 미세 관찰',
    path: 'audio/4.wav',
    desc: '"이제 벽을 등지고 잠시 눈을 감아보세요…"'
  },
  {
    id: '5',
    scene: 'SCENE 03 — 도착',
    title: '나레이션 05 — 촬영 지시',
    path: 'audio/5.wav',
    desc: '"이제 휴대폰 속 카메라를 클릭해 균열을 찍어봅니다."'
  },
  {
    id: '6',
    scene: 'SCENE 05 — 물증',
    title: '나레이션 06 — 수리 완료',
    path: 'audio/6.wav',
    desc: '"성공적으로 수리되었습니다…"'
  },
  {
    id: '7',
    scene: 'SCENE 06 — 복귀',
    title: '나레이션 07 — 기억과 장소',
    path: 'audio/7.wav',
    desc: '"우리가 무심히 지나는 장소들은…"'
  },
  {
    id: '8',
    scene: 'SCENE 06 — 복귀',
    title: '나레이션 08 — 마지막 임무',
    path: 'audio/8.wav',
    desc: '"이제는 당신 차례입니다…"'
  },
]

export default function GuidePage({ onExit }) {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const audioRef = useRef(null)

  // 키패드 숫자 입력
  const handleKey = (num) => {
    if (pin.length >= 3) return
    const next = pin + num
    setPin(next)
    setError(false)
    if (next.length === 3) {
      if (next === '000') {
        setTimeout(() => setUnlocked(true), 300)
      } else {
        setTimeout(() => { setError(true); setPin('') }, 400)
      }
    }
  }

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  // 오디오 재생 (로컬 + BroadcastChannel 동시)
  const handlePlay = (track) => {
    if (playingId === track.id) {
      // 정지
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      sendStopAudio()
      setPlayingId(null)
      return
    }

    // 이전 정지
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const audio = new Audio(track.path)
    audio.volume = 0.9
    audio.play().catch(console.error)
    audio.onended = () => setPlayingId(null)
    audioRef.current = audio

    // 플레이어에게 송출
    sendPlayAudio(track.id)
    setPlayingId(track.id)
  }

  // 컴포넌트 언마운트 시 정지
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  // 잠금 화면
  if (!unlocked) {
    return (
      <div className="guide-page">
        <div className="guide-lock">
          {/* 헤더 */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              letterSpacing: '0.25em', color: 'var(--text-muted)',
              textTransform: 'uppercase', marginBottom: '8px'
            }}>
              KOHE — 가이드 전용
            </p>
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: '22px',
              fontStyle: 'italic', color: 'var(--text-primary)'
            }}>
              나레이션 컨트롤
            </p>
          </div>

          {/* PIN 표시 */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '16px', height: '16px',
                borderRadius: '50%',
                background: pin.length > i ? 'var(--text-primary)' : 'transparent',
                border: `2px solid ${error ? 'var(--alert)' : 'var(--border)'}`,
                transition: 'all 0.2s ease'
              }}/>
            ))}
          </div>

          {error && (
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--alert)', letterSpacing: '0.1em'
            }}>
              비밀번호가 틀렸습니다
            </p>
          )}

          {/* 키패드 */}
          <div className="guide-keypad">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} className="keypad-btn" onClick={() => handleKey(String(n))}>
                {n}
              </button>
            ))}
            <button className="keypad-btn" onClick={handleBackspace} style={{ fontSize: '16px' }}>
              ⌫
            </button>
            <button className="keypad-btn" onClick={() => handleKey('0')}>
              0
            </button>
            <button className="keypad-btn" onClick={() => setPin('')} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              C
            </button>
          </div>

          {/* 플레이어로 돌아가기 */}
          <button className="btn btn-ghost" onClick={onExit} style={{ fontSize: '11px' }}>
            ← 플레이어 화면으로
          </button>
        </div>
      </div>
    )
  }

  // 가이드 패널
  return (
    <div className="guide-page">
      {/* 상단 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            letterSpacing: '0.2em', color: 'var(--text-muted)',
            textTransform: 'uppercase', marginBottom: '2px'
          }}>
            KOHE — 가이드 전용
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)', fontSize: '18px',
            fontStyle: 'italic', color: 'var(--text-primary)'
          }}>
            나레이션 컨트롤 패널
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onExit} style={{ fontSize: '11px' }}>
          ← 나가기
        </button>
      </div>

      {/* 안내 박스 */}
      <div style={{ padding: '16px 24px' }}>
        <div className="sys-message">
          <span className="sys-icon">💡</span>
          버튼을 클릭하면 접속한 모든 플레이어 기기(갤럭시·아이폰)에 나레이션이 실시간 송출됩니다.<br/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-faint)' }}>
            * 플레이어는 사이트 접속 후 화면을 한 번 탭하면 자동 연결됩니다. (인터넷 필요)
          </span>
        </div>
      </div>

      {/* 트랙 목록 */}
      <div style={{ paddingBottom: '48px' }}>
        {TRACKS.map((track, i) => {
          const isPlaying = playingId === track.id
          return (
            <div key={track.id} className="audio-track">
              <div className="audio-track-info">
                <span className="audio-track-scene">{track.scene}</span>
                <span className="audio-track-title">{track.title}</span>
                <span style={{
                  fontFamily: 'var(--font-serif)', fontSize: '12px',
                  fontStyle: 'italic', color: 'var(--text-faint)',
                  marginTop: '2px'
                }}>
                  {track.desc}
                </span>
              </div>
              <button
                className={`audio-play-btn${isPlaying ? ' playing' : ''}`}
                onClick={() => handlePlay(track)}
                aria-label={isPlaying ? `${track.title} 정지` : `${track.title} 재생`}
              >
                {isPlaying ? '■' : '▶'}
              </button>
            </div>
          )
        })}
      </div>

      {/* 현재 재생 중 표시 */}
      {playingId && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: '12px',
          backdropFilter: 'blur(20px)',
          zIndex: 50
        }}>
          <div className="dots-loader">
            <span style={{ background: 'var(--accent-warm)' }}/>
            <span style={{ background: 'var(--accent-warm)' }}/>
            <span style={{ background: 'var(--accent-warm)' }}/>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em' }}>
            {TRACKS.find(t => t.id === playingId)?.title} 송출 중
          </p>
          <button
            style={{
              marginLeft: 'auto', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'var(--bg-primary)', borderRadius: '4px',
              padding: '4px 12px', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '11px'
            }}
            onClick={() => {
              if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
              sendStopAudio()
              setPlayingId(null)
            }}
          >
            정지
          </button>
        </div>
      )}
    </div>
  )
}
