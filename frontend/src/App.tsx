import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  version: string
  database: string
}

type ConnectionState =
  | { kind: 'checking' }
  | { kind: 'connected'; data: HealthResponse }
  | { kind: 'error'; message: string }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function App() {
  const [state, setState] = useState<ConnectionState>({ kind: 'checking' })

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<HealthResponse>
      })
      .then((data) => setState({ kind: 'connected', data }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-medium text-stone-900">AI Wardrobe</h1>
        <p className="mt-1 text-sm text-stone-500">Phase 1 — Scaffold</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span
            className={
              'h-2.5 w-2.5 rounded-full ' +
              (state.kind === 'connected'
                ? 'bg-emerald-500'
                : state.kind === 'error'
                  ? 'bg-red-500'
                  : 'bg-amber-400 animate-pulse')
            }
          />
          <span className="text-sm font-medium text-stone-700">
            {state.kind === 'checking' && 'Checking backend…'}
            {state.kind === 'connected' && 'Backend connected'}
            {state.kind === 'error' && 'Backend unreachable'}
          </span>
        </div>

        {state.kind === 'connected' && (
          <dl className="mt-6 space-y-1 text-left text-sm text-stone-600">
            <div className="flex justify-between">
              <dt>API version</dt>
              <dd className="font-mono">{state.data.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Database</dt>
              <dd className="font-mono">{state.data.database}</dd>
            </div>
          </dl>
        )}

        {state.kind === 'error' && (
          <p className="mt-4 text-sm text-red-600">{state.message}</p>
        )}
      </div>
    </div>
  )
}

export default App
