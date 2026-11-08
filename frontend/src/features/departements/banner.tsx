import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
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

function VersetsBanniere({ compact = false }: { compact?: boolean }) {
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
      className={cn(
        'flex w-full shrink-0 flex-col rounded-xl bg-white/12 backdrop-blur-sm',
        compact ? 'h-44 px-5 py-4 md:w-96' : 'h-40 px-5 py-4 md:w-80',
      )}
      aria-live="polite"
    >
      <p className={cn('tracking-wide text-white/70 uppercase', compact ? 'text-sm' : 'text-xs')}>Parole</p>
      <p
        className={cn(
          'leading-relaxed italic',
          compact ? 'mt-2 line-clamp-3 text-base' : 'mt-2 line-clamp-3 h-[4.5rem] text-sm',
        )}
      >
        « {verset.texte} »
      </p>
      <p className={cn('mt-auto text-white/70', compact ? 'text-sm' : 'text-xs')}>{verset.reference}</p>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {VERSETS.map((item, itemIndex) => (
          <span
            key={item.reference}
            className={cn(
              'rounded-full',
              compact ? 'h-2 w-2' : 'h-1.5 w-1.5',
              itemIndex === index ? 'bg-white' : 'bg-white/30',
            )}
          />
        ))}
      </div>
    </aside>
  )
}

export type PointProgression = {
  id: string
  titre: string
  fait: boolean
  contexte?: string
  vers?: string
}

export type ProgressionBanniere = {
  id: string
  label: string
  valeur: number
  detail?: string
  points?: PointProgression[]
  action?: { label: string; to: string }
}

export function DepartementBanner({
  prenom,
  message,
  titre,
  action,
  progressions,
  compact = false,
}: {
  prenom: string
  message: string
  titre?: string
  action?: ReactNode
  progressions?: ProgressionBanniere[]
  compact?: boolean
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl bg-linear-to-r from-brand-500 via-brand-600 to-brand-800 text-white shadow-[0_12px_32px_rgba(60,1,115,0.28)]',
        compact ? 'px-5 py-4' : 'px-6 py-6',
      )}
    >
      <GerbeMotif
        className={cn(
          'pointer-events-none absolute -top-8 -right-10 w-auto opacity-15',
          compact ? 'h-28' : 'h-48',
        )}
      />
      <div
        className={cn(
          'relative flex flex-col md:flex-row md:justify-between',
          progressions && progressions.length > 0 ? 'md:items-end' : 'md:items-center',
          compact ? 'gap-3' : 'gap-6',
        )}
      >
        <div className="min-w-0 flex-1">
          <h1 className={cn('font-semibold tracking-tight', compact ? 'text-xl' : 'text-2xl')}>Bonjour {prenom}</h1>
          <p className="mt-1 text-sm text-white/80">Paix et grâce à vous.</p>
          {titre && <h2 className={cn('font-medium text-white', compact ? 'mt-2 text-sm' : 'mt-3 text-base')}>{titre}</h2>}
          {message && <p className={cn('text-sm text-white/90', titre ? 'mt-1' : compact ? 'mt-2' : 'mt-3')}>{message}</p>}
          {action && <div className="mt-4">{action}</div>}
          {progressions && progressions.length > 0 && (
            <div className={cn('flex w-full flex-col', compact ? 'mt-3 gap-2' : 'mt-6 gap-4')}>
          {progressions.map((item, index) => {
            const manquants = (item.points ?? []).filter((point) => !point.fait)
            return (
              <div key={item.id}>
                <div className={cn('flex items-center justify-between gap-3', compact ? 'text-xs' : 'text-sm')}>
                  <span className="font-medium">{item.label}</span>
                  <span>{item.valeur} %</span>
                </div>
                <div
                  className={cn(
                    'flex gap-1',
                    compact ? 'mt-2' : 'mt-2.5',
                    index === 0 ? 'h-3' : 'h-2',
                  )}
                  role="progressbar"
                  aria-label={item.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.valeur}
                  aria-valuetext={
                    manquants.length > 0
                      ? `${item.valeur} %. Non cochés : ${manquants.map((point) => point.titre).join(', ')}`
                      : `${item.valeur} %`
                  }
                >
                  {item.points && item.points.length > 0 ? (
                    item.points.map((point) => (
                      <div
                        key={point.id}
                        title={`${point.titre}${point.contexte ? ` · ${point.contexte}` : ''} · ${point.fait ? 'Coché' : 'À cocher'}`}
                        className={cn('h-full min-w-2 flex-1 rounded-full', point.fait ? 'bg-white' : 'bg-white/25')}
                      />
                    ))
                  ) : (
                    <div className="h-full flex-1 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-white" style={{ width: `${item.valeur}%` }} />
                    </div>
                  )}
                </div>
                {manquants.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5" aria-label="Préparations non cochées">
                    {manquants.map((point) => {
                      const contenu = (
                        <>
                          <span className="size-3 shrink-0 rounded-full border-2 border-white/80" aria-hidden="true" />
                          <span className="min-w-0 truncate">{point.titre}</span>
                          {point.contexte && (
                            <span className="ml-auto shrink-0 text-white/65">{point.contexte}</span>
                          )}
                        </>
                      )
                      return (
                        <li key={point.id}>
                          {point.vers ? (
                            <Link
                              to={point.vers}
                              className="flex items-center gap-2 text-xs text-white/90 hover:text-white"
                            >
                              {contenu}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-2 text-xs text-white/90">{contenu}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {item.detail && (
                  <p className={cn('text-white/75', compact ? 'mt-2 text-xs' : 'mt-2 text-sm')}>{item.detail}</p>
                )}
                {item.action && (
                  <Link
                    to={item.action.to}
                    className="mt-3 inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-brand-700 shadow-sm hover:bg-white/90"
                  >
                    {item.action.label}
                  </Link>
                )}
              </div>
            )
          })}
            </div>
          )}
        </div>
        <VersetsBanniere compact={compact} />
      </div>
    </section>
  )
}
