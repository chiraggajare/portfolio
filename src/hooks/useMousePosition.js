import { useEffect, useRef, useCallback } from 'react'

export default function useMousePosition() {
  const posRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize to -1 to 1 range — write to ref, no re-render
      posRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      posRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Return the ref object so consumers always read the latest value without re-renders
  return posRef.current
}
