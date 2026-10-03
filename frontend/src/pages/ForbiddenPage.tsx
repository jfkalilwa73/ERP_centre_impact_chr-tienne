import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <p className="font-mono text-sm text-slate-400">403</p>
        <h1 className="text-2xl font-semibold text-slate-900">Accès refusé</h1>
        <p className="mt-1 text-sm text-slate-500">
          Votre compte n'a pas la permission d'ouvrir cette section.
        </p>
      </div>
      <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        Retour à l'accueil
      </Link>
    </div>
  )
}
