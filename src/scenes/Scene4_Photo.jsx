import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GaugeBar from '../components/GaugeBar.jsx'

export default function Scene4_Photo({ photoDataUrl, selectedClay, onComplete }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const animIdRef = useRef(null)
  const clayMeshRef = useRef(null)

  const [sentences, setSentences] = useState(['', '', ''])
  const [gaugeValue, setGaugeValue] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [clayPos, setClayPos] = useState({ x: 50, y: 40 }) // % position
  const [isSealed, setIsSealed] = useState(false)
  const [sealEffect, setSealEffect] = useState(false)
  const frameRef = useRef(null)

  // Three.js 3D 오버레이 캔버스
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    const ambLight = new THREE.AmbientLight(0xffffff, 1.5)
    scene.add(ambLight)
    const dirLight = new THREE.DirectionalLight(0xC4A882, 2)
    dirLight.position.set(3, 5, 5)
    scene.add(dirLight)

    // 선택된 Clay 모델 로드
    const modelPath = selectedClay?.path || 'models/egg.glb'
    const loader = new GLTFLoader()
    loader.load(
      modelPath,
      (gltf) => {
        const obj = gltf.scene
        obj.scale.setScalar(0.5)
        obj.position.set(0, 0.5, 0)

        // 질감 없는 클레이 머티리얼
        const mat = new THREE.MeshStandardMaterial({
          color: 0xCCC7BE, roughness: 1.0, metalness: 0.0
        })
        obj.traverse(child => { if (child.isMesh) child.material = mat.clone() })
        scene.add(obj)
        clayMeshRef.current = obj
      },
      undefined,
      () => {
        // 폴백 구체
        const geo = new THREE.SphereGeometry(0.5, 32, 32)
        const mat = new THREE.MeshStandardMaterial({ color: 0xCCC7BE, roughness: 1.0 })
        const mesh = new THREE.Mesh(geo, mat)
        scene.add(mesh)
        clayMeshRef.current = mesh
      }
    )

    let t = 0
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate)
      t += 0.01
      if (clayMeshRef.current) {
        clayMeshRef.current.rotation.y += 0.01
        clayMeshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animIdRef.current)
      renderer.dispose()
    }
  }, [selectedClay])

  // 게이지 계산
  useEffect(() => {
    const filled = sentences.filter(s => s.trim().length > 3).length
    const target = (filled / 3) * 100
    setGaugeValue(target)
    if (filled >= 3) setIsComplete(true)
  }, [sentences])

  // 드래그 핸들러 (터치 & 마우스)
  const handleDragStart = (e) => {
    if (!isComplete || isSealed) return
    setIsDragging(true)
    e.preventDefault()
  }

  const handleDragMove = (e) => {
    if (!isDragging) return
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setClayPos({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    })
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // 균열 영역(중앙~하단)에 놓으면 봉합
    if (clayPos.y > 40 && clayPos.y < 80) {
      setSealEffect(true)
      import('../utils/audioEngine.js').then(({ playClayStick }) => playClayStick())
      setTimeout(() => {
        setIsSealed(true)
      }, 600)
    }
  }

  const handleComplete = () => {
    onComplete()
  }

  return (
    <div className="scene">
      {/* 사진 배경 */}
      <div
        ref={frameRef}
        style={{
          position: 'absolute', inset: 0,
          onTouchMove: handleDragMove,
          onMouseMove: handleDragMove,
          onTouchEnd: handleDragEnd,
          onMouseUp: handleDragEnd,
        }}
        onTouchMove={handleDragMove}
        onMouseMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseUp={handleDragEnd}
      >
        {photoDataUrl ? (
          <img src={photoDataUrl} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'brightness(0.85) contrast(1.1) saturate(0.8)'
          }} alt="captured crack"/>
        ) : (
          // 테스트용 그래디언트 배경
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #D8D3CA 0%, #C0BAB0 50%, #A8A299 100%)'
          }}/>
        )}

        {/* 3D 오버레이 캔버스 (드래그 가능) */}
        <div
          style={{
            position: 'absolute',
            left: `${clayPos.x}%`,
            top: `${clayPos.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px',
            cursor: isComplete && !isSealed ? 'grab' : 'default',
            transition: isDragging ? 'none' : 'all 0.3s ease',
            opacity: isSealed ? 0 : 1,
            filter: isDragging ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            zIndex: 10,
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
          />
        </div>

        {/* 봉합 이펙트 */}
        {sealEffect && (
          <div style={{
            position: 'absolute',
            left: `${clayPos.x}%`,
            top: `${clayPos.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,168,130,0.6) 0%, transparent 70%)',
            animation: 'sealIn 0.6s ease forwards',
            zIndex: 15,
          }}/>
        )}

        {/* 봉합 완료 표시 */}
        {isSealed && (
          <div style={{
            position: 'absolute',
            left: `${clayPos.x}%`,
            top: `${clayPos.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '60px', height: '60px',
            borderRadius: '50%',
            background: 'rgba(196,168,130,0.4)',
            border: '2px solid rgba(196,168,130,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
            animation: 'sealIn 0.4s var(--ease-spring) forwards',
            zIndex: 15
          }}>
            ✦
          </div>
        )}
      </div>

      {/* 하단 패널 */}
      <div className="memory-panel">
        {/* 헤더 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            letterSpacing: '0.15em', color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            SCENE 04 — 기억 봉합
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: isComplete ? 'var(--accent-deep)' : 'var(--text-faint)'
          }}>
            접착제 제조 {Math.round(gaugeValue)}%
          </span>
        </div>

        <GaugeBar value={gaugeValue} label="" />

        {/* 문장 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '12px',
            color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '4px'
          }}>
            이곳에는 어떤 기억이 있을까요? 3개의 문장이면 충분합니다.
          </p>
          {sentences.map((s, i) => (
            <input
              key={i}
              type="text"
              className="text-input"
              style={{ padding: '10px 14px', fontSize: '13px' }}
              placeholder={`기억 ${i + 1}…`}
              value={s}
              onChange={(e) => {
                const next = [...sentences]
                next[i] = e.target.value
                setSentences(next)
              }}
            />
          ))}
        </div>

        {isComplete && !isSealed && (
          <p className="fade-text" style={{
            fontFamily: 'var(--font-serif)', fontSize: '14px',
            fontStyle: 'italic', color: 'var(--accent-deep)',
            textAlign: 'center', marginTop: '12px'
          }}>
            위의 조각을 드래그해 균열 위에 놓아주세요
          </p>
        )}

        {isSealed && (
          <button
            className="btn btn-primary fade-text"
            style={{ width: '100%', marginTop: '16px' }}
            onClick={handleComplete}
          >
            봉합 완료 →
          </button>
        )}
      </div>

      <style>{`
        @keyframes sealIn {
          from { transform: translate(-50%,-50%) scale(0); opacity: 1; }
          to { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
