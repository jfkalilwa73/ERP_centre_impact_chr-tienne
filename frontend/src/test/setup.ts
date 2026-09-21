import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { resetActivites } from '@/features/departements/activites'
import { resetPersonneFamilles } from '@/features/personnes/familles'
import { resetFicheComplements } from '@/features/personnes/fiche'
import { resetPersonnePhotos } from '@/features/personnes/photos'
import { resetMockDb } from '@/mocks/db'
import { handlers } from '@/mocks/handlers'
import { useAuthStore } from '@/stores/authStore'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockDb()
  resetPersonneFamilles()
  resetFicheComplements()
  resetPersonnePhotos()
  resetActivites()
  useAuthStore.getState().closeSession()
  localStorage.clear()
})

afterAll(() => server.close())
