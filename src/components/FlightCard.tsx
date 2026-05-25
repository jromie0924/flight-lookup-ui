import { useId, useState } from 'react';
import type { FlightRecord } from '../types/flight';

interface FlightCardProps {
  flight: FlightRecord;
}

interface DetailRow {
  label: string;
  value: string;
}

export function FlightCard({ flight }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const details = buildDetails(flight);
  const hasDetails = details.length > 0;
  const detailsId = useId();
  const planespottersUrl = "https://planespotters.net/photos/reg/";
  const openstreetmapUrl = "https://www.openstreetmap.org/";

  const get_timestamp = (ts: number) => {
    if (!ts) {
      return null;
    }
    return new Date(ts ?? 0).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  const header = (
    <>
      <span className="flight-card-callsign">{get_timestamp(flight.timestamp ?? 0) ?? 'Unknown'}</span>
      <p className="flight-card-time">&#9992;&#65038;</p>
    </>
  );

  return (
    <article className="flight-card">
      {hasDetails ? (
        <button
          type="button"
          className="flight-card-header flight-card-toggle"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
        >
          {header}
          <span className="flight-card-chevron" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </button>
      ) : (
        <header className="flight-card-header">{header}</header>
      )}
      {hasDetails && expanded && (
        <>
          <dl className="flight-card-details" id={detailsId}>
            {details.map((row) => (
              <div className="flight-card-detail" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            {flight.r && (
            <a
              className="flight-card-detail"
              href={`${planespottersUrl}${encodeURIComponent(flight.r)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              planespotters
            </a>
          )}
          {flight.lat && flight.lon && (
            <a
              className="flight-card-detail"
              href={`${openstreetmapUrl}?mlat=${flight.lat}&mlon=${flight.lon}#map=10/${flight.lat}/${flight.lon}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Location
            </a>
          )}
          </dl>
          {/* {flight.r && (
            <a
              className="flight-card-link"
              href={`${planespottersUrl}${encodeURIComponent(flight.r)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              planespotters
            </a>
          )} */}
          {/* {flight.lat && flight.lon && (
            <a
              className="flight-card-link"
              href={`${openstreetmapUrl}?mlat=${flight.lat}&mlon=${flight.lon}#map=10/${flight.lat}/${flight.lon}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Location
            </a>
          )} */}
        </>
      )}
    </article>
  );
}

/** Picks the known ADS-B fields that are actually present on this record. */
function buildDetails(flight: FlightRecord): DetailRow[] {
  const rows: DetailRow[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value !== undefined && value !== '') rows.push({ label, value });
  };

  // add('Callsign', flight.callsign);
  add('Registration', flight.r);
  add('Aircraft', flight.t);
  if (typeof flight.squawk === 'string') {
    add('Squawk', flight.squawk);
  }

  if (typeof flight.alt_baro === 'number') {
    add('Altitude', `${flight.alt_baro.toLocaleString()} ft`);
  } else if (typeof flight.alt_baro === 'string') {
    add('Altitude', flight.alt_baro === 'ground' ? 'On ground' : flight.alt_baro);
  }
  if (typeof flight.alt_geom === 'number') {
    add('Geom. altitude', `${flight.alt_geom.toLocaleString()} ft`);
  }
  if (typeof flight.baro_rate === 'number') {
    const rate = flight.baro_rate;
    add('Vertical rate', `${rate > 0 ? '+' : ''}${rate.toLocaleString()} ft/min`);
  }
  if (typeof flight.gs === 'number') {
    add('Ground speed', `${Math.round(flight.gs)} kt`);
  }
  if (typeof flight.track === 'number') {
    add('Track', `${Math.round(flight.track)}°`);
  }
  if (typeof flight.lat === 'number') {
    add('Latitude', `${flight.lat.toFixed(4)}°`);
  }
  if (typeof flight.lon === 'number') {
    add('Longitude', `${flight.lon.toFixed(4)}°`);
  }

  return rows;
}
