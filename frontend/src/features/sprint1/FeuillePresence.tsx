import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useEnregistrerPresences, useFeuillePresence, useSynchroniserSuivi } from './hooks'

export function FeuillePresence({ familleId, canWrite }: { familleId: string; canWrite: boolean }) {
  const feuille = useFeuillePresence(familleId)
  const synchroniser = useSynchroniserSuivi(familleId)
  const enregistrer = useEnregistrerPresences(familleId)
  const [dateReunion, setDateReunion] = useState(() => new Date().toISOString().slice(0, 10))
  const [presents, setPresents] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const lignes = feuille.data?.presences.filter((ligne) => ligne.dateReunion === dateReunion) ?? []
    const next: Record<string, boolean> = {}
    for (const ligne of lignes) next[ligne.idAffectation] = ligne.present
    setPresents(next)
  }, [feuille.data, dateReunion])

  const affectations = feuille.data?.affectations ?? []

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Feuille de présence</h2>
      <p className="mt-1 text-sm text-slate-500">
        La présence est enregistrée par date de réunion, pour les membres déjà suivis. Le bouton reprend les personnes déjà affectées sur cette famille.
      </p>
      {canWrite && (
        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            isLoading={synchroniser.isPending}
            onClick={() => synchroniser.mutate()}
          >
            Reprendre les personnes affectées
          </Button>
        </div>
      )}
      {synchroniser.isError && (
        <Alert className="mt-3" variant="error" title="Reprise impossible">
          {synchroniser.error.message}
        </Alert>
      )}

      {feuille.isError && (
        <Alert className="mt-4" variant="error" title="Présences inaccessibles">
          {feuille.error.message}
        </Alert>
      )}

      {feuille.isSuccess && affectations.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">Aucun membre affecté à suivre pour le moment.</p>
      )}

      {affectations.length > 0 && (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            enregistrer.mutate({
              dateReunion,
              lignes: affectations.map((item) => ({
                idAffectation: item.idAffectation,
                present: Boolean(presents[item.idAffectation]),
              })),
            })
          }}
        >
          {enregistrer.isError && (
            <Alert variant="error" title="Enregistrement impossible">
              {enregistrer.error.message}
            </Alert>
          )}
          <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium text-slate-800">
            Date de réunion
            <Input type="date" value={dateReunion} onChange={(event) => setDateReunion(event.target.value)} required />
          </label>
          <ul className="divide-y divide-slate-100 border border-slate-200">
            {affectations.map((item) => (
              <li key={item.idAffectation} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  {item.prenom} {item.nom}
                  {item.numeroMembre ? <span className="text-slate-500"> · {item.numeroMembre}</span> : null}
                </span>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(presents[item.idAffectation])}
                    disabled={!canWrite}
                    onChange={(event) =>
                      setPresents((current) => ({ ...current, [item.idAffectation]: event.target.checked }))
                    }
                  />
                  Présent
                </label>
              </li>
            ))}
          </ul>
          {canWrite && (
            <div>
              <Button type="submit" isLoading={enregistrer.isPending}>
                Enregistrer la présence
              </Button>
            </div>
          )}
        </form>
      )}
    </section>
  )
}
