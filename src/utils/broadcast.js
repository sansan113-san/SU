// BroadcastChannel 기반 가이드 ↔ 플레이어 오디오 제어
// 같은 기기/브라우저 내에서 작동. 다른 기기 간 연동 시 WebSocket 서버 필요.

const CHANNEL_NAME = 'kohe-audio-control'

let bc = null

function getChannel() {
  if (!bc) {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME)
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e)
    }
  }
  return bc
}

// 가이드가 플레이어에게 오디오 재생 명령 전송
export function sendPlayAudio(trackId) {
  const ch = getChannel()
  if (ch) {
    ch.postMessage({ type: 'PLAY_AUDIO', trackId })
  }
  // localStorage 폴백 (같은 탭 내에서도 동작)
  localStorage.setItem('kohe-play-audio', JSON.stringify({ trackId, ts: Date.now() }))
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'kohe-play-audio',
    newValue: JSON.stringify({ trackId, ts: Date.now() })
  }))
}

// 가이드가 플레이어에게 오디오 정지 명령 전송
export function sendStopAudio() {
  const ch = getChannel()
  if (ch) ch.postMessage({ type: 'STOP_AUDIO' })
  localStorage.setItem('kohe-play-audio', JSON.stringify({ trackId: null, ts: Date.now() }))
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'kohe-play-audio',
    newValue: JSON.stringify({ trackId: null, ts: Date.now() })
  }))
}

// 플레이어 앱에서 명령 수신 리스너 등록
export function listenForPlayCommands(callback) {
  const ch = getChannel()

  const bcHandler = (event) => {
    if (event.data?.type === 'PLAY_AUDIO' || event.data?.type === 'STOP_AUDIO') {
      callback(event.data)
    }
  }

  const storageHandler = (event) => {
    if (event.key === 'kohe-play-audio') {
      try {
        const data = JSON.parse(event.newValue)
        callback({ type: data.trackId ? 'PLAY_AUDIO' : 'STOP_AUDIO', trackId: data.trackId })
      } catch {}
    }
  }

  if (ch) ch.addEventListener('message', bcHandler)
  window.addEventListener('storage', storageHandler)

  return () => {
    if (ch) ch.removeEventListener('message', bcHandler)
    window.removeEventListener('storage', storageHandler)
  }
}
