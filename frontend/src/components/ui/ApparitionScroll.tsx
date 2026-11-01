import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ApparitionScrollProps = {
  children: ReactNode
  className?: string
  /** Décalage avant le mouvement, pour enchaîner des cartes voisines. */
  decalage?: number
}

function mouvementReduit() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Fait monter le bloc quand il entre dans l'écran. */
export function ApparitionScroll({
  children,
  className,
  decalage = 0,
}: ApparitionScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (mouvementReduit()) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const style = { '--reveal-delay': `${decalage}ms` } as CSSProperties

  return (
    <div ref={ref} className={cn('scroll-reveal', visible && 'is-visible', className)} style={style}>
      {children}
    </div>
  )
}
