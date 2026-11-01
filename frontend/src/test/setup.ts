import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { resetActivites } from '@/features/departements/activites'
import { resetBudget } from '@/features/departements/budget'
import { resetDecisions } from '@/features/departements/decisions'
import { resetEquipe } from '@/features/departements/equipe'
import { resetProjets } from '@/features/departements/projets'
import { resetRapports } from '@/features/departements/rapports'
import { resetCirculations } from '@/features/notifications/circulation'
import { resetDemandes } from '@/features/notifications/store'
import { resetActivitesFamille } from '@/features/familles/activites'
import { resetFicheComplements } from '@/features/personnes/fiche'
import { resetPersonnePhotos } from '@/features/personnes/photos'
import { setTestAffectationsProvider } from '@/lib/writeAccess'
import { resetMockDb, mockDb } from '@/mocks/db'
import { handlers } from '@/mocks/handlers'
import { useAuthStore } from '@/stores/authStore'

export const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  setTestAffectationsProvider(() => ({
    dept: mockDb.affectations,
    famille: mockDb.affectationsFamille,
  }))
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockDb()
  resetFicheComplements()
  resetPersonnePhotos()
  resetActivites()
  resetActivitesFamille()
  resetEquipe()
  resetBudget()
  resetRapports()
  resetProjets()
  resetDecisions()
  resetDemandes()
  resetCirculations()
  useAuthStore.getState().closeSession()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => server.close())
