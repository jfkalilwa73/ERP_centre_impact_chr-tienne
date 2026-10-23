import { useState } from 'react'
import { Input } from '@/components/ui/Input'

export type LieuTrouve = {
  id: string
  nom: string
  latitude: number
  longitude: number
}

type NominatimLieu = {
  place_id: number
  lat: string
  lon: string
  display_name: string
}

export function RechercheLieu({
  onChoisir,
}: {
  onChoisir: (lieu: LieuTrouve) => void
}) {
  const [texte, setTexte] = useState('')
  const [resultats, setResultats] = useState<LieuTrouve[]>([])
  const [message, setMessage] = useState<string>()
  const [enCours, setEnCours] = useState(false)

  async function rechercher() {
    const q = texte.trim()
    if (q.length < 2) {
      setMessage('Saisissez au moins deux lettres, par exemple Masina ou Ndjili.')
      setResultats([])
      return
    }
    setEnCours(true)
    setMessage(undefined)
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('q', q)
      url.searchParams.set('limit', '5')
      url.searchParams.set('countrycodes', 'cd')
      url.searchParams.set('accept-language', 'fr')
      url.searchParams.set('viewbox', '15.12,-4.55,15.58,-4.26')
      url.searchParams.set('bounded', '0')
      const reponse = await fetch(url)
      if (!reponse.ok) throw new Error('recherche')
      const lieux = (await reponse.json()) as NominatimLieu[]
      const trouves = lieux.map((lieu) => ({
        id: String(lieu.place_id),
        nom: lieu.display_name,
        latitude: Number(lieu.lat),
        longitude: Number(lieu.lon),
      }))
      setResultats(trouves)
      setMessage(trouves.length === 0 ? 'Aucun lieu trouvé. Essayez un quartier ou une commune.' : undefined)
    } catch {
      setResultats([])
      setMessage('La recherche est indisponible. Vous pouvez encore cliquer sur la carte.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={texte}
          onChange={(event) => setTexte(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void rechercher()
            }
          }}
          placeholder="Masina, Ndjili, Gombe…"
          aria-label="Rechercher un lieu"
          disabled={enCours}
        />
        <button
          type="button"
          className="h-10 shrink-0 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          onClick={() => void rechercher()}
          disabled={enCours}
        >
          {enCours ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
      {resultats.length > 0 && (
        <ul className="overflow-hidden rounded-lg border border-slate-200">
          {resultats.map((lieu) => (
            <li key={lieu.id} className="border-b border-slate-100 last:border-0">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  onChoisir(lieu)
                  setResultats([])
                  setTexte(lieu.nom.split(',')[0] ?? lieu.nom)
                }}
              >
                {lieu.nom}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
