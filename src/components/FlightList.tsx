import type { FlightQuery } from '../api/flights';
import type { FlightRecord } from '../types/flight';
import { FlightCard } from './FlightCard';

interface FlightListProps {
  flights: FlightRecord[];
  query: FlightQuery;
}

export function FlightList({ flights, query }: FlightListProps) {
  if (flights.length === 0) {
    return (
      <p className="status status-empty">
        No flights found for <strong>{query.callsign}</strong>
        {query.timestamp ? ' near that time.' : '.'}
      </p>
    );
  }

  return (
    <section className="flight-list" aria-label="Search results">
      <p className="flight-list-count">
        {flights.length} {flights.length === 1 ? 'record' : 'records'} for{' '}
        <strong>{query.callsign}</strong>
      </p>
      <ul className="flight-list-items">
        {flights.map((flight, index) => (
          <li key={flightKey(flight, index)}>
            <FlightCard flight={flight} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Stable-ish key from the record contents, falling back to the list index. */
function flightKey(flight: FlightRecord, index: number): string {
  const ts = flight.timestamp ?? '';
  return `${flight.callsign ?? 'flight'}-${ts}-${index}`;
}
