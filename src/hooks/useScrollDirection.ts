import { useEffect, useRef, useCallback } from 'react'
import { useStore } from './useStore'

export function useScrollDirection(threshold = 10) {
  const { setHeaderVisible, setFooterVisible } = useStore()
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY
    const diff = scrollY - lastScrollY.current

    if (Math.abs(diff) < threshold) {
      ticking.current = false
      return
    }

    if (diff > 0) {
      setHeaderVisible(false)
      setFooterVisible(false)
    } else {
      setHeaderVisible(true)
      setFooterVisible(true)
    }

    lastScrollY.current = scrollY > 0 ? scrollY : 0
    ticking.current = false
  }, [setHeaderVisible, setFooterVisible, threshold])

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking.current = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [updateScrollDirection])
}

