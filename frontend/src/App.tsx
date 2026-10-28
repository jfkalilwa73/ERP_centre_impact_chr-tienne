import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { SuccessFeedbackRegion } from '@/components/ui/SuccessFeedbackRegion'
import { queryClient } from '@/lib/queryClient'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SuccessFeedbackRegion />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
