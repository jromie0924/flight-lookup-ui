import { useState } from 'react';
import type { FormEvent } from 'react';
import type { FlightQuery } from '../api/flights';

interface SearchFormProps {
  onSearch: (query: FlightQuery) => void;
  busy: boolean;
}

export function SearchForm({ onSearch, busy }: SearchFormProps) {
  const [callsign, setCallsign] = useState('');
  const [timestamp, setTimestamp] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = callsign.trim().toUpperCase();
    if (!trimmed) return;
    onSearch({ callsign: trimmed, timestamp: timestamp || undefined });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Callsign</span>
        <input
          className="field-input"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. UAL123"
          value={callsign}
          onChange={(event) => setCallsign(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">
          Around time{' '}
          <span className="field-hint">optional &middot; &plusmn;15 min window</span>
        </span>
        <input
          className="field-input"
          type="datetime-local"
          value={timestamp}
          onChange={(event) => setTimestamp(event.target.value)}
        />
      </label>

      <button className="submit-button" type="submit" disabled={busy || !callsign.trim()}>
        {busy ? 'Searching...' : 'Search flights'}
      </button>
    </form>
  );
}
