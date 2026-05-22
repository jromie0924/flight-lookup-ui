import type { FlightRecord } from '../types/flight';

interface FlightCardProps {
  flight: FlightRecord;
}

interface DetailRow {
  label: string;
  value: string;
}

export function FlightCard({ flight }: FlightCardProps) {
  const details = buildDetails(flight);

  return (
    <article className="flight-card">
      <header className="flight-card-header">
        <span className="flight-card-callsign">{flight.callsign ?? 'Unknown'}</span>
        <time className="flight-card-time">{formatTimestamp(flight.timestamp)}</time>
      </header>
      {details.length > 0 && (
        <dl className="flight-card-details">
          {details.map((row) => (
            <div className="flight-card-detail" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

/** Picks the known fields that are actually present on this record. */
function buildDetails(flight: FlightRecord): DetailRow[] {
  const rows: DetailRow[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value !== undefined && value !== '') rows.push({ label, value });
  };

  add('ICAO', flight.icao);
  add('Registration', flight.registration);
  add('Aircraft', flight.aircraftType);
  add('Origin', flight.origin);
  add('Destination', flight.destination);

  if (typeof flight.altitude === 'number') {
    add('Altitude', `${flight.altitude.toLocaleString()} ft`);
  }
  if (typeof flight.groundSpeed === 'number') {
    add('Ground speed', `${flight.groundSpeed} kt`);
  }
  if (typeof flight.heading === 'number') {
    add('Heading', `${Math.round(flight.heading)}°`);
  }
  if (typeof flight.latitude === 'number' && typeof flight.longitude === 'number') {
    add('Position', `${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)}`);
  }

  return rows;
}

function formatTimestamp(raw: FlightRecord['timestamp']): string {
  if (raw === undefined || raw === '') return 'Unknown time';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
