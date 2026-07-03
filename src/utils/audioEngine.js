// Web Audio API 엔진 — 앰비언트, 효과음, 나레이션 관리

let audioContext = null
let ambientGain = null
let narrationGain = null
let currentAmbient = null
let currentNarration = null

// AudioContext 초기화 (첫 유저 인터랙션 후 호출)
export function initAudio() {
  if (audioContext) return audioContext
  audioContext = new (window.AudioContext || window.webkitAudioContext)()

  ambientGain = audioContext.createGain()
  ambientGain.gain.setValueAtTime(0.18, audioContext.currentTime)
  ambientGain.connect(audioContext.destination)

  narrationGain = audioContext.createGain()
  narrationGain.gain.setValueAtTime(1.0, audioContext.currentTime)
  narrationGain.connect(audioContext.destination)

  return audioContext
}

// 몽환적 앰비언트 사운드 생성 (프로시저럴)
export function startAmbient() {
  const ctx = initAudio()
  if (currentAmbient) return

  // 여러 오실레이터로 드론 앰비언트 생성
  const frequencies = [80, 160, 240, 320, 480]
  const sources = []

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq + Math.random() * 4, ctx.currentTime)

    // 미세한 피치 모듈레이션
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(freq + 2, ctx.currentTime + 8)
    osc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 16)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400 + i * 80, ctx.currentTime)
    filter.Q.setValueAtTime(2, ctx.currentTime)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime((0.15 - i * 0.025), ctx.currentTime + 3)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ambientGain)
    osc.start()

    sources.push({ osc, gain })
  })

  currentAmbient = sources
}

// 앰비언트 볼륨 전환
export function setAmbientVolume(volume, duration = 2) {
  if (!ambientGain) return
  const ctx = initAudio()
  ambientGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration)
}

// 나레이션 WAV 파일 재생
export function playNarration(trackPath) {
  return new Promise(async (resolve) => {
    const ctx = initAudio()
    if (ctx.state === 'suspended') await ctx.resume()

    stopNarration()

    try {
      const response = await fetch(trackPath)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(narrationGain)
      source.start()
      source.onended = resolve
      currentNarration = source
    } catch (e) {
      console.error('Narration playback error:', e)
      resolve()
    }
  })
}

// 나레이션 정지
export function stopNarration() {
  if (currentNarration) {
    try { currentNarration.stop() } catch {}
    currentNarration = null
  }
}

// 삐- 경고음 생성
export function playBeepError() {
  const ctx = initAudio()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3)

  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

// 점토 붙는 눅눅한 효과음 생성
export function playClayStick() {
  const ctx = initAudio()

  // 화이트 노이즈 버스트
  const bufferSize = ctx.sampleRate * 0.2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(400, ctx.currentTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.5, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

// 따뜻한 귀환 앰비언트로 전환
export function transitionToWarmAmbient() {
  if (!ambientGain) return
  setAmbientVolume(0.28, 3)
}

// 진동 (모바일)
export function vibrateDevice(pattern = [200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}
