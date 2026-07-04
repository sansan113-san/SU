import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import GaugeBar from '../components/GaugeBar.jsx'

const CLAY_MODELS = [
  { id: 'lea', path: 'models/lea.glb', label: 'LEA' },
  { id: 'ca', path: 'models/ca.glb', label: 'CA' },
  { id: 'egg', path: 'models/egg.glb', label: 'EGG' },
]

export default function Scene1_Papri({ onComplete }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const animIdRef = useRef(null)
  const particlesRef = useRef([])
  const bgMeshRef = useRef(null)
  const explodedRef = useRef(false) // 도시 폭발(clay 진입) 여부 — BG 늦은 로드 레이스 방지
  const clayMeshesRef = useRef([])

  const [phase, setPhase] = useState('city') // city | explode | clay | input | warning | map
  const [selectedClay, setSelectedClay] = useState(null)
  const [memoryText, setMemoryText] = useState('')
  const [gaugeValue, setGaugeValue] = useState(0)
  const [isError, setIsError] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [clayLoaded, setClayLoaded] = useState([false, false, false])
  const gaugeRef = useRef(null)

  // Three.js 초기화
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, 2, 8)
    camera.lookAt(0, 0.6, 0)
    cameraRef.current = camera

    // 조명
    const ambLight = new THREE.AmbientLight(0xFAF8F5, 1.2)
    scene.add(ambLight)
    const dirLight = new THREE.DirectionalLight(0xC4A882, 1.5)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)
    const fillLight = new THREE.DirectionalLight(0xD4B896, 0.5)
    fillLight.position.set(-5, 2, -3)
    scene.add(fillLight)

    // GLB PBR 텍스처가 자연스럽게 보이도록 중립 환경맵 적용
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.35

    // BG.glb 백그라운드 로드 (스트리밍)
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(
      'models/BG.glb',
      (gltf) => {
        const glb = gltf.scene
        glb.scale.setScalar(1.0)
        glb.position.set(0, -1, 0)

        // 이미 폭발(clay 진입)했다면 늦게 도착한 BG는 버림 (레이스 방지)
        if (explodedRef.current) return
        // 원본 텍스처/재질 유지
        glb.traverse((child) => {
          if (child.isMesh) child.castShadow = true
        })
        bgMeshRef.current = glb
        scene.add(glb)
      },
      undefined,
      (err) => {
        // GLB 로드 실패 시 폴백: 프로시저럴 도시
        createProceduralCity(scene)
      }
    )

    // 애니메이션 루프
    let t = 0
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate)
      t += 0.005

      if (bgMeshRef.current) {
        bgMeshRef.current.rotation.y = Math.sin(t * 0.3) * 0.08
        bgMeshRef.current.position.y = -1 + Math.sin(t * 0.5) * 0.1
      }

      // 파티클 업데이트
      particlesRef.current.forEach((p, i) => {
        if (!p.mesh.parent) return
        p.vx += (Math.random() - 0.5) * 0.002
        p.vy -= 0.015 + Math.random() * 0.005
        p.vz += (Math.random() - 0.5) * 0.002
        p.mesh.position.x += p.vx
        p.mesh.position.y += p.vy
        p.mesh.position.z += p.vz
        p.mesh.rotation.x += 0.05
        p.mesh.rotation.y += 0.03
        p.life -= 0.02
        if (p.life <= 0) {
          scene.remove(p.mesh)
          particlesRef.current.splice(i, 1)
        }
      })

      // Clay 메시 회전
      clayMeshesRef.current.forEach((m) => {
        if (m) {
          m.rotation.y += 0.008
          m.position.y = m.baseY + Math.sin(t * 2 + m.phaseOffset) * 0.05
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!canvas) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  // 프로시저럴 도시 폴백
  function createProceduralCity(scene) {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0xD8D3CA, roughness: 0.85, metalness: 0
    })

    // 불규칙한 블록 배치
    const configs = [
      { x: 0, y: 0.5, z: 0, w: 1.2, h: 1, d: 1.2 },
      { x: 1.5, y: 0.8, z: 0.3, w: 0.8, h: 1.6, d: 0.8 },
      { x: -1.5, y: 0.6, z: -0.2, w: 1, h: 1.2, d: 1 },
      { x: 0.3, y: 1.1, z: -1.4, w: 0.6, h: 2.2, d: 0.6 },
      { x: -0.8, y: 0.3, z: 1.2, w: 1.4, h: 0.6, d: 0.8 },
      { x: 2, y: 0.4, z: -1, w: 0.7, h: 0.8, d: 0.7 },
    ]

    const group = new THREE.Group()
    configs.forEach(c => {
      const geo = new THREE.BoxGeometry(c.w, c.h, c.d)
      const mesh = new THREE.Mesh(geo, buildingMat)
      mesh.position.set(c.x, c.y, c.z)
      group.add(mesh)
    })
    group.position.set(0, -1, 0)
    bgMeshRef.current = group
    scene.add(group)
  }

  // 도시 폭발 인터랙션
  const handleCityClick = useCallback(() => {
    if (phase !== 'city') return
    setPhase('explode')
    explodedRef.current = true

    const scene = sceneRef.current
    if (!scene) return

    // 파티클 생성
    const particleMat = new THREE.MeshStandardMaterial({ color: 0xD8D3CA, roughness: 0.9 })
    for (let i = 0; i < 24; i++) {
      const size = 0.05 + Math.random() * 0.15
      const geo = new THREE.BoxGeometry(size, size * 0.6, size * 0.8)
      const mesh = new THREE.Mesh(geo, particleMat.clone())
      mesh.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      scene.add(mesh)
      particlesRef.current.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.12,
        vy: Math.random() * 0.1 + 0.04,
        vz: (Math.random() - 0.5) * 0.12,
        life: 1
      })
    }

    // 기존 도시 제거
    if (bgMeshRef.current) {
      scene.remove(bgMeshRef.current)
      bgMeshRef.current = null
    }

    // 잠시 후 Clay 등장
    setTimeout(() => loadClayModels(), 1200)
  }, [phase])

  // GLB Clay 모델 로드
  function loadClayModels() {
    const scene = sceneRef.current
    if (!scene) return

    const gltfLoader = new GLTFLoader()

    const positions = [-0.92, 0, 0.92] // 모바일 세로 화면에서 3개 모두 보이도록 간격 축소
    const CLAY_Y = 0.7 // 화면 중앙 위쪽에 보이도록
    const CLAY_SIZE = 1.0 // 정규화 목표 크기 (최대 치수)
    const loaded = [false, false, false]

    CLAY_MODELS.forEach((model, i) => {
      gltfLoader.load(
        model.path,
        (gltf) => {
          const obj = gltf.scene

          // 1) 크기 정규화 — 모델마다 스케일이 달라 최대 치수를 목표값에 맞춤
          obj.updateMatrixWorld(true)
          let box = new THREE.Box3().setFromObject(obj)
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          obj.scale.setScalar(CLAY_SIZE / maxDim)

          // 2) 바운딩박스 중심을 원점으로 이동 (내부 원점 차이 보정)
          obj.updateMatrixWorld(true)
          box = new THREE.Box3().setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          obj.position.sub(center)

          // 3) 텍스처 유지 + 선택 하이라이트용 개별 인스턴스로 복제
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = child.material.clone()
              if (child.material.emissive) {
                child.userData.baseEmissive = child.material.emissive.clone()
                child.userData.baseEmissiveIntensity = child.material.emissiveIntensity ?? 1
              }
            }
          })

          // 4) 홀더 그룹에 담아 위치/선택 스케일을 정규화와 분리
          const holder = new THREE.Group()
          holder.add(obj)
          holder.position.set(positions[i], CLAY_Y, 0)
          holder.baseY = CLAY_Y
          holder.phaseOffset = i * 1.2
          scene.add(holder)
          clayMeshesRef.current[i] = holder

          loaded[i] = true
          setClayLoaded([...loaded])
        },
        undefined,
        () => {
          // GLB 로드 실패 시 단순 구체 폴백 (정규화 크기에 맞춤)
          const geo = new THREE.SphereGeometry(0.65, 32, 32)
          const mat = new THREE.MeshStandardMaterial({ color: 0xCCC7BE, roughness: 1 })
          const mesh = new THREE.Mesh(geo, mat)
          const holder = new THREE.Group()
          holder.add(mesh)
          holder.position.set(positions[i], CLAY_Y, 0)
          holder.baseY = CLAY_Y
          holder.phaseOffset = i * 1.2
          scene.add(holder)
          clayMeshesRef.current[i] = holder
          loaded[i] = true
          setClayLoaded([...loaded])
        }
      )
    })

    setPhase('clay')
  }

  // Clay 선택 하이라이트
  function highlightClay(idx) {
    clayMeshesRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const selected = i === idx
      // 텍스처는 유지하고 발광(emissive)만 조절해 선택 표시
      mesh.traverse((child) => {
        if (child.isMesh && child.material?.emissive) {
          if (selected) {
            child.material.emissive.setHex(0xC4A882)
            child.material.emissiveIntensity = 0.35
          } else if (child.userData.baseEmissive) {
            child.material.emissive.copy(child.userData.baseEmissive)
            child.material.emissiveIntensity = child.userData.baseEmissiveIntensity
          } else {
            child.material.emissiveIntensity = 0
          }
        }
      })
      // 선택된 조각 살짝 앞으로 + 확대
      mesh.position.z = selected ? 1 : 0
      mesh.scale.setScalar(selected ? 1.16 : 1)
    })
  }

  const handleClaySelect = (idx) => {
    setSelectedClay(idx)
    highlightClay(idx)
    setTimeout(() => setPhase('input'), 300)
  }

  // 기억 텍스트 입력 게이지
  useEffect(() => {
    if (phase !== 'input') return

    const words = memoryText.trim().split(/\s+/).filter(Boolean).length
    const target = Math.min(32, words * 4)

    clearInterval(gaugeRef.current)
    gaugeRef.current = setInterval(() => {
      setGaugeValue(prev => {
        if (prev < target) return Math.min(target, prev + 0.5)
        return prev
      })
    }, 50)

    return () => clearInterval(gaugeRef.current)
  }, [memoryText, phase])

  const handleMemorySubmit = () => {
    if (phase !== 'input') return
    // 게이지 32%에서 멈추고 경고
    setGaugeValue(32)
    setTimeout(() => {
      setIsError(true)
      setShowWarning(true)
      // 삐- 경고음
      import('../utils/audioEngine.js').then(({ playBeepError }) => playBeepError())
      setTimeout(() => setShowMap(true), 1200)
    }, 400)
    setPhase('warning')
  }

  const handleProceed = () => {
    onComplete({ selectedClay: CLAY_MODELS[selectedClay] })
  }

  return (
    <div
      className="scene scene-enter"
      onClick={handleCityClick}
      style={{ cursor: phase === 'city' ? 'pointer' : 'default' }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="three-canvas"
      />

      {/* UI Layer */}
      <div className="ui-layer" style={{ pointerEvents: 'none' }}>
        {/* Header */}
        <div className="header-bar" style={{ pointerEvents: 'auto' }}>
          <span className="header-logo">KOHE — 장소 수리반</span>
          <span className="header-badge">SCENE 01</span>
        </div>

        <div className="content-area" style={{ pointerEvents: 'auto' }}>
          {/* Phase: city */}
          {phase === 'city' && (
            <div className="fade-text" style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '40px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                파프리 — 사전 준비
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                화면을 탭하여 시작하세요
              </p>
              <div className="dots-loader" style={{ marginTop: '16px', justifyContent: 'center' }}>
                <span/><span/><span/>
              </div>
            </div>
          )}

          {/* Phase: explode */}
          {phase === 'explode' && (
            <div className="fade-text" style={{ textAlign: 'center', marginTop: 'auto' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>
                Cor 분리 중…
              </p>
              <div className="dots-loader" style={{ marginTop: '12px', justifyContent: 'center' }}>
                <span/><span/><span/>
              </div>
            </div>
          )}

          {/* Phase: clay — 카드 선택 (3D 위에 UI 오버레이) */}
          {phase === 'clay' && (
            <div style={{ marginTop: 'auto', width: '100%' }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em',
                color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center',
                marginBottom: '20px'
              }}>
                Cor를 하나 선택하세요
              </p>
              <div className="clay-grid">
                {CLAY_MODELS.map((m, i) => (
                  <div
                    key={m.id}
                    className={`clay-card${selectedClay === i ? ' selected' : ''}`}
                    onClick={() => handleClaySelect(i)}
                    style={{ backdropFilter: 'blur(12px)', background: 'rgba(242,239,233,0.7)' }}
                  >
                    <span style={{ fontSize: '28px', opacity: 0.5 }}>◻</span>
                    <span className="clay-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase: input */}
          {phase === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
              <GaugeBar
                value={gaugeValue}
                label={`기억의 점성 생성 중…… ${Math.round(gaugeValue)}%`}
                isError={isError}
              />
              <textarea
                className="text-input"
                rows={3}
                placeholder="이곳에서 떠오르는 기억을 적어주세요…"
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleMemorySubmit}>
                접착제 주입 →
              </button>
            </div>
          )}

          {/* Phase: warning */}
          {phase === 'warning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
              <GaugeBar value={32} label="기억의 점성 생성 중…… 32%" isError={true} />

              {showWarning && (
                <div className="sys-message fade-text">
                  <span className="sys-icon">⚠️</span>
                  이런! 기억 접착제가 부족합니다. 현장으로 이동해 생생한 감각을 수집해 주세요!<br/>
                  걱정마세요. 앞에 손을 흔드는 <strong>[코헤]</strong>를 따라가면 됩니다!
                </div>
              )}

              {showMap && (
                <div className="map-preview fade-text">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                    첫 번째 목적지
                  </p>
                  <div className="map-grid map-glow">
                    <div className="map-block"/>
                    <div className="map-block"/>
                    <div className="map-block"/>
                    <div className="map-block"/>
                  </div>
                  <div className="map-dot"/>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={handleProceed}
                  >
                    현장으로 이동 →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scene Indicator */}
        <div className="scene-indicator">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className={`scene-dot ${n === 1 ? 'active' : ''}`}/>
          ))}
        </div>
      </div>
    </div>
  )
}
