import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Les mocks MSW remplacent l'API tant que le backend Laravel n'expose pas les
 * routes du contrat. Basculer VITE_USE_MOCKS sur false pour taper le vrai serveur.
 * Le garde sur VITE_APP_ENV interdit toute simulation en production, même si la
 * variable y était laissée à true par erreur.
 */
async function startMockServer() {
  const isMockingAllowed =
    import.meta.env.VITE_USE_MOCKS === 'true' && import.meta.env.VITE_APP_ENV !== 'production'

  if (!isMockingAllowed) return

  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

startMockServer().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
