/**
 * One row from the `tracker_log` DynamoDB table, as returned by GET /flights.
 *
 * The exact response schema is owned by the `plane-tracker-rgb-pi` backend and
 * is not pinned by this repo's guidelines. So only `callsign` and `timestamp`
 * are treated as expected; every other field is optional, and the UI renders
 * whatever the API actually returns. The index signature keeps unknown extra
 * fields from breaking the build.
 */
export interface FlightRecord {
  /** Aircraft callsign the row was logged under. */
  callsign?: string;
  /** When the row was logged — ISO-8601 string or epoch value. */
  timestamp?: string | number;
  /** 24-bit ICAO hex address. */
  icao?: string;
  /** Aircraft tail / registration. */
  registration?: string;
  /** Aircraft type designator. */
  aircraftType?: string;
  /** Decimal degrees. */
  latitude?: number;
  /** Decimal degrees. */
  longitude?: number;
  /** Altitude in feet. */
  altitude?: number;
  /** Ground speed in knots. */
  groundSpeed?: number;
  /** Heading / track in degrees. */
  heading?: number;
  /** Origin airport, if the backend records it. */
  origin?: string;
  /** Destination airport, if the backend records it. */
  destination?: string;
  /** Tolerate any other fields the API may return. */
  [key: string]: unknown;
}
