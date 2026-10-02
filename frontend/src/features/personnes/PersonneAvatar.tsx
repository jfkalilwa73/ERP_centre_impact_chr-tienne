import { cn } from '@/lib/cn'
import type { Personne } from '@/types'
import { initials } from './duplicates'
import { usePersonnePhoto } from './photos'

export function PersonneAvatar({
  personne,
  className,
  initialsClassName,
}: {
  personne: Personne
  className?: string
  initialsClassName?: string
}) {
  const photo = usePersonnePhoto(personne.idPersonne, personne.photoUrl)
  const name = `${personne.prenom} ${personne.nom}`

  if (photo) {
    return (
      <img src={photo} alt={name} className={cn('shrink-0 rounded-full object-cover', className)} />
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        initialsClassName,
        className,
      )}
      aria-hidden="true"
    >
      {initials(personne)}
    </span>
  )
}
