import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-gray-100">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ERP Église
            </h1>
            <p className="text-gray-600 mb-6">
              Centre Impact Chrétien
            </p>
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
              Frontend initialisé avec succès !
            </div>
            <p className="text-xs text-gray-400 mt-6">
              Environnement : {import.meta.env.VITE_APP_ENV}
            </p>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App