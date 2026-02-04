'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}
