import { ChargementCentre } from '@/components/ui/Chargement'

export function DepartementLoading({ label }: { label: string }) {
  return <ChargementCentre label={label} page />
}

export function TableLoading({ label }: { label: string }) {
  return <ChargementCentre label={label} />
}
