import { useEffect, useState, type ReactNode } from 'react'
import { GerbeMotif } from '@/components/brand/GerbeMotif'
import { cn } from '@/lib/cn'

const VERSETS = [
  {
    texte: 'Il y a diversité de dons, mais le même Esprit.',
    reference: '1 Corinthiens 12.4',
  },
  {
    texte: "Que chacun mette au service des autres le don qu'il a reçu.",
    reference: '1 Pierre 4.10',
  },
  {
    texte: 'Que tout se fasse avec dignité et ordre.',
    reference: '1 Corinthiens 14.40',
  },
] as const

const VERSET_INTERVAL_MS = 7000

function VersetsBanniere() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % VERSETS.length)
    }, VERSET_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const verset = VERSETS[index]!

  return (
    <aside
      className="flex h-40 w-full shrink-0 flex-col rounded-xl bg-white/12 px-5 py-4 backdrop-blur-sm md:w-80"
      aria-live="polite"
    >
      <p className="text-xs tracking-wide text-white/70 uppercase">Parole</p>
      <p className="mt-2 line-clamp-3 h-[4.5rem] text-sm leading-relaxed italic">
        « {verset.texte} »
      </p>
      <p className="mt-auto text-xs text-white/70">{verset.reference}</p>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {VERSETS.map((item, itemIndex) => (
          <span
            key={item.reference}
            className={cn('h-1.5 w-1.5 rounded-full', itemIndex === index ? 'bg-white' : 'bg-white/30')}
          />
        ))}
      </div>
    </aside>
  )
}

export function DepartementBanner({
  prenom,
  message,
  titre,
  action,
}: {
  prenom: string
  message: string
  titre?: string
  action?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-brand-500 via-brand-600 to-brand-800 px-6 py-6 text-white shadow-[0_12px_32px_rgba(60,1,115,0.28)]">
      <GerbeMotif className="pointer-events-none absolute -top-8 -right-10 h-48 w-auto opacity-15" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Bonjour {prenom}</h1>
          <p className="mt-1 text-sm text-white/80">Paix et grâce à vous.</p>
          {titre && <h2 className="mt-3 text-base font-medium text-white">{titre}</h2>}
          <p className={cn('text-sm text-white/90', titre ? 'mt-1' : 'mt-3')}>{message}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
        <VersetsBanniere />
      </div>
    </section>
  )
}
