import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Reusable Three.js animated background.
 * Renders floating Kahoot-coloured geometric shapes (triangles, diamonds,
 * circles, squares) – styled after the Kahoot answer-button icons.
 * The canvas is absolutely positioned behind all content.
 */
export default function ThreeBackground({ opacity = 0.55 }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    renderer.domElement.style.pointerEvents = 'none'
    renderer.domElement.style.opacity = String(opacity)
    container.appendChild(renderer.domElement)

    // ── Scene & Camera ─────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    )
    camera.position.z = 30

    // ── Kahoot palette ─────────────────────────────────────────
    const COLORS = [0xe21b3c, 0x1368ce, 0xd89e00, 0x26890c, 0x7b2ff7, 0xffffff]

    // ── Shape factory ──────────────────────────────────────────
    const shapes = []

    function makeTriangle() {
      const geo = new THREE.BufferGeometry()
      const s = 0.9
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          [0, s, 0, -s * 0.866, -s * 0.5, 0, s * 0.866, -s * 0.5, 0],
          3,
        ),
      )
      geo.setIndex([0, 1, 2])
      geo.computeVertexNormals()
      return geo
    }

    function makeDiamond() {
      const geo = new THREE.BufferGeometry()
      const s = 0.8
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([0, s, 0, -s, 0, 0, 0, -s, 0, s, 0, 0], 3),
      )
      geo.setIndex([0, 1, 2, 0, 2, 3])
      geo.computeVertexNormals()
      return geo
    }

    const GEOMETRIES = [
      makeTriangle(),
      makeDiamond(),
      new THREE.CircleGeometry(0.7, 32),
      new THREE.PlaneGeometry(1.1, 1.1),
    ]

    const COUNT = 45
    for (let i = 0; i < COUNT; i++) {
      const geoIdx = Math.floor(Math.random() * GEOMETRIES.length)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12 + Math.random() * 0.18,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(GEOMETRIES[geoIdx], mat)

      const spread = 40
      mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 1.5,
        (Math.random() - 0.5) * 20 - 5,
      )
      const scale = 0.6 + Math.random() * 2.2
      mesh.scale.setScalar(scale)
      mesh.rotation.z = Math.random() * Math.PI * 2

      scene.add(mesh)
      shapes.push({
        mesh,
        speedX: (Math.random() - 0.5) * 0.008,
        speedY: 0.008 + Math.random() * 0.018,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        initY: mesh.position.y,
      })
    }

    // ── Animation loop ─────────────────────────────────────────
    let rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)

      shapes.forEach(({ mesh, speedX, speedY, rotSpeed }) => {
        mesh.position.x += speedX
        mesh.position.y += speedY
        mesh.rotation.z += rotSpeed

        // Wrap vertically
        if (mesh.position.y > 28) mesh.position.y = -28
        // Gentle horizontal drift wrap
        if (mesh.position.x > 25) mesh.position.x = -25
        if (mesh.position.x < -25) mesh.position.x = 25
      })

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize handler ─────────────────────────────────────────
    const onResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      GEOMETRIES.forEach(g => g.dispose())
      shapes.forEach(({ mesh }) => mesh.material.dispose())
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [opacity])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
