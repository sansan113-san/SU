// 가이드 ↔ 플레이어 오디오 제어
//
// 두 계층으로 동작:
//  1) ntfy.sh 공개 릴레이 (기기 간 = 가이드 폰 → 갤럭시/아이폰 플레이어 폰)
//     - 서버/계정/키 불필요. 정적 배포(GitHub Pages)에서 그대로 동작.
//     - 추측 불가능한 비밀 토픽명으로 외부 간섭 차단.
//  2) BroadcastChannel + localStorage (같은 기기/브라우저 폴백 = 테스트용)
//
// 토픽명을 바꾸려면 URL에 ?room=코드 를 붙이면 됩니다. (예: ...#guide?room=abcd)
// 기본값은 아래 고정 비밀 채널.

const DEFAULT_ROOM = 'kohe-cor-repair-x7q2m9-2026'

function getRoom() {
  try {
    // 해시(#guide?room=xxx) 또는 쿼리(?room=xxx) 모두 지원
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    const src = hash.includes('room=') ? hash : search
    const m = src.match(/room=([A-Za-z0-9_-]+)/)
    if (m) return `kohe-${m[1]}`
  } catch {}
  return DEFAULT_ROOM
}

const NTFY_BASE = 'https://ntfy.sh'
const CHANNEL_NAME = 'kohe-audio-control'

let bc = null
function getChannel() {
  if (!bc) {
    try { bc = new BroadcastChannel(CHANNEL_NAME) }
    catch (e) { console.warn('BroadcastChannel not supported:', e) }
  }
  return bc
}

// ── 같은 기기 폴백 브로드캐스트 ─────────────────────────────
function localBroadcast(payload) {
  const ch = getChannel()
  if (ch) ch.postMessage(payload)
  try {
    const v = JSON.stringify({ ...payload, ts: Date.now() })
    localStorage.setItem('kohe-play-audio', v)
    window.dispatchEvent(new StorageEvent('storage', { key: 'kohe-play-audio', newValue: v }))
  } catch {}
}

// ── 가이드 → ntfy 릴레이로 명령 전송 ───────────────────────
function ntfyPublish(payload) {
  const room = getRoom()
  // keepAlive/no-cors 문제를 피하려고 fetch 사용. 실패해도 로컬 폴백은 이미 전송됨.
  fetch(`${NTFY_BASE}/${room}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Title': 'kohe', 'Priority': 'high' },
    keepalive: true,
  }).catch((e) => console.warn('ntfy publish failed:', e))
}

// 가이드가 플레이어에게 오디오 재생 명령 전송
export function sendPlayAudio(trackId) {
  const payload = { type: 'PLAY_AUDIO', trackId }
  localBroadcast(payload)
  ntfyPublish(payload)
}

// 가이드가 플레이어에게 오디오 정지 명령 전송
export function sendStopAudio() {
  const payload = { type: 'STOP_AUDIO', trackId: null }
  localBroadcast(payload)
  ntfyPublish(payload)
}

// ── 플레이어: 명령 수신 리스너 등록 ────────────────────────
// callback(data), onStatus(connected:boolean) 제공
export function listenForPlayCommands(callback, onStatus) {
  // 1) 같은 기기 채널
  const ch = getChannel()
  const bcHandler = (event) => {
    const d = event.data
    if (d?.type === 'PLAY_AUDIO' || d?.type === 'STOP_AUDIO') callback(d)
  }
  const storageHandler = (event) => {
    if (event.key !== 'kohe-play-audio') return
    try {
      const data = JSON.parse(event.newValue)
      callback({ type: data.trackId ? 'PLAY_AUDIO' : 'STOP_AUDIO', trackId: data.trackId })
    } catch {}
  }
  if (ch) ch.addEventListener('message', bcHandler)
  window.addEventListener('storage', storageHandler)

  // 2) ntfy.sh SSE — 기기 간 수신 (자동 재연결)
  const room = getRoom()
  let es = null
  let closed = false
  const lastSeen = { id: null }

  const connect = () => {
    if (closed) return
    try {
      es = new EventSource(`${NTFY_BASE}/${room}/sse`)
    } catch (e) {
      console.warn('EventSource init failed:', e)
      return
    }
    es.onopen = () => onStatus && onStatus(true)
    es.onmessage = (evt) => {
      try {
        const env = JSON.parse(evt.data)
        if (env.event === 'open' || env.event === 'keepalive') return
        if (env.event !== 'message') return
        // 중복 방지
        if (env.id && env.id === lastSeen.id) return
        lastSeen.id = env.id
        const data = JSON.parse(env.message)
        if (data?.type === 'PLAY_AUDIO' || data?.type === 'STOP_AUDIO') callback(data)
      } catch {}
    }
    es.onerror = () => {
      onStatus && onStatus(false)
      // EventSource가 자동 재연결하지만, 완전히 닫힌 경우 수동 복구
      if (es && es.readyState === 2 && !closed) {
        try { es.close() } catch {}
        setTimeout(connect, 2000)
      }
    }
  }
  connect()

  return () => {
    closed = true
    if (ch) ch.removeEventListener('message', bcHandler)
    window.removeEventListener('storage', storageHandler)
    if (es) { try { es.close() } catch {} }
  }
}
