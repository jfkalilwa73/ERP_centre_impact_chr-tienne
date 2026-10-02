import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <p className="font-mono text-sm text-slate-400">404</p>
        <h1 className="text-2xl font-semibold text-slate-900">Page introuvable</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cette page n'existe pas ou n'est pas encore disponible.
        </p>
      </div>
      <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        Retour à l'accueil
      </Link>
    </div>
  )
}
