import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'

export function renderApp(initialPath = '/connexion') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  }
}

export async function seConnecter(
  user: ReturnType<typeof userEvent.setup>,
  email = 'admin@eglise.org',
  motDePasse = 'SecurePass123!',
) {
  await user.type(screen.getByLabelText('Adresse e-mail'), email)
  await user.type(screen.getByLabelText('Mot de passe'), motDePasse)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
}
