/**
 * One flight row from GET /flights.
 *
 * The backend (`plane-tracker-rgb-pi`) logs raw ADS-B records, so field names
 * follow the dump1090 / readsb `aircraft.json` schema (`alt_baro`, `gs`,
 * `lat`, `lon`, ...) rather than friendly names. Every field is optional — a
 * receiver only reports what it actually decoded — and the index signature
 * tolerates the many extra ADS-B fields the UI does not surface.
 */
export interface FlightRecord {
  /** Aircraft callsign the row was logged under. */
  callsign?: string;
  /** When the row was logged — epoch milliseconds (or ISO string). */
  timestamp?: string | number;
  /** ISO-8601 form of `timestamp`, if the backend includes it. */
  timestamp_readable?: string;
  /** 24-bit ICAO hex address. */
  hex?: string;
  /** Aircraft tail / registration. */
  r?: string;
  /** Aircraft type designator (e.g. `E75L`). */
  t?: string;
  /** Barometric altitude in feet, or the string `"ground"`. */
  alt_baro?: number | string;
  /** Geometric (GNSS) altitude in feet. */
  alt_geom?: number;
  /** Barometric vertical rate in feet per minute (negative = descending). */
  baro_rate?: number;
  /** Ground speed in knots. */
  gs?: number;
  /** True track over ground in degrees. */
  track?: number;
  /** Mode-A squawk code. */
  squawk?: string;
  /** Latitude in decimal degrees. */
  lat?: number;
  /** Longitude in decimal degrees. */
  lon?: number;
  /** Tolerate the many other ADS-B fields the API returns. */
  [key: string]: unknown;
}
