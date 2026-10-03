import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Fondu + léger décalage à chaque changement d'écran. */
export function PageTransition() {
  const location = useLocation()

  useEffect(() => {
    const scrollingElement = document.scrollingElement ?? document.documentElement
    if (typeof scrollingElement.scrollTo === 'function') {
      scrollingElement.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }, [location.pathname])

  return (
    <div key={location.pathname} className="page-enter">
      <Outlet />
    </div>
  )
}
