import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Fondu + léger décalage à chaque changement d'écran. */
export function PageTransition() {
  const location = useLocation()
  const pagePath = location.pathname

  useEffect(() => {
    const scrollingElement = document.scrollingElement ?? document.documentElement
    if (typeof scrollingElement.scrollTo === 'function') {
      scrollingElement.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }, [location.pathname])

  useEffect(() => {
    // L'accueil possède déjà ses propres apparitions au défilement.
    if (pagePath === '/' || prefersReducedMotion()) return

    const page = document.querySelector<HTMLElement>('.page-enter')
    if (!page) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const element = entry.target as HTMLElement
          element.classList.add('is-visible')
          observer.unobserve(element)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )

    const revealed = new WeakSet<HTMLElement>()
    let revealIndex = 0
    const reveal = (element: HTMLElement) => {
      if (revealed.has(element) || element.closest('form, [role="dialog"]')) return
      revealed.add(element)
      element.classList.add('scroll-reveal')
      element.style.setProperty('--reveal-delay', `${Math.min(revealIndex++ * 60, 240)}ms`)
      observer.observe(element)
    }

    const pageContent = page.firstElementChild
    if (pageContent instanceof HTMLElement) {
      Array.from(pageContent.children).forEach((element) => {
        if (element instanceof HTMLElement) reveal(element)
      })
    }

    // Certains panneaux sont ajoutés après les requêtes de données. Observe
    // aussi les nouvelles sections et cartes pour qu'elles ne surgissent pas
    // sans transition une fois le chargement terminé.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.parentElement === page || node.parentElement === pageContent) reveal(node)
          if (node.matches('section, article, .grid, .rounded-xl, .rounded-2xl')) reveal(node)
          node
            .querySelectorAll<HTMLElement>('section, article, .grid, .rounded-xl, .rounded-2xl')
            .forEach(reveal)
        }
      }
    })
    mutationObserver.observe(page, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      observer.disconnect()
    }
  }, [pagePath])

  return (
    <div key={location.pathname} className="page-enter">
      <Outlet />
    </div>
  )
}
