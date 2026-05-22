import { useCallback, useRef, useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { FlightList } from './components/FlightList';
import { ApiError, fetchFlights } from './api/flights';
import type { FlightQuery } from './api/flights';
import type { FlightRecord } from './types/flight';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<FlightQuery | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (query: FlightQuery) => {
    // Cancel any request still in flight so its result can't land late.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError('');
    setLastQuery(query);

    try {
      const results = await fetchFlights(query, controller.signal);
      if (controller.signal.aborted) return;
      setFlights(results);
      setStatus('success');
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
      setStatus('error');
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>&#9992;&#65039; Flight Lookup</h1>
        <p className="app-tagline">Search flights logged by Jackson's plane tracker.</p>
      </header>

      <main className="app-main">
        <SearchForm onSearch={handleSearch} busy={status === 'loading'} />

        {status === 'loading' && (
          <p className="status status-loading">Searching...</p>
        )}

        {status === 'error' && (
          <p className="status status-error" role="alert">
            {error}
          </p>
        )}

        {status === 'success' && lastQuery && (
          <FlightList flights={flights} query={lastQuery} />
        )}
      </main>

      <footer className="app-footer">
        <p>Read-only companion app for plane-tracker-rgb-pi.</p>
      </footer>
    </div>
  );
}
